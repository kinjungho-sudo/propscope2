import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MolitService } from '../molit/molit.service';
import { PropertyType } from '@prisma/client';
import { format, subMonths } from 'date-fns';

@Injectable()
export class CollectorService {
  private readonly logger = new Logger(CollectorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly molit: MolitService,
  ) {}

  /**
   * 구/군(sigunguCode) 내 동 레코드를 DB에서 가져오거나, 없으면 자동 생성
   */
  private async getOrCreateRegion(
    sigunguCode: string,
    sigunguName: string,
    sidoName: string,
    dongName: string,
    regionCache: Map<string, { id: string; sidoName: string; sigunguName: string; dongName: string }>,
  ) {
    if (regionCache.has(dongName)) return regionCache.get(dongName)!;

    // DB 조회
    const existing = await this.prisma.region.findFirst({
      where: { sigunguCode, dongName },
    });
    if (existing) {
      regionCache.set(dongName, existing);
      return existing;
    }

    // 사용 중인 dongCode 목록
    const used = await this.prisma.region.findMany({
      where: { sigunguCode },
      select: { dongCode: true },
    });
    const usedCodes = new Set(used.map((r) => r.dongCode));

    // 해시 기반 고유 dongCode 생성
    let h = 0;
    for (const c of dongName + sigunguCode) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
    let dongCode = (100 + (h % 899)).toString().padStart(3, '0');
    while (usedCodes.has(dongCode)) {
      h = (h + 1) & 0xffff;
      dongCode = (100 + (h % 899)).toString().padStart(3, '0');
    }

    const lawdCd = sigunguCode + dongCode + '00';
    try {
      const created = await this.prisma.region.create({
        data: {
          lawdCd,
          sidoCode: sigunguCode.slice(0, 2),
          sigunguCode,
          dongCode,
          sidoName,
          sigunguName,
          dongName,
        },
      });
      this.logger.log(`[자동생성] ${sidoName} ${sigunguName} ${dongName} (${lawdCd})`);
      regionCache.set(dongName, created);
      return created;
    } catch {
      // 동시 생성 충돌 → 재조회
      const retry = await this.prisma.region.findFirst({ where: { sigunguCode, dongName } });
      if (retry) { regionCache.set(dongName, retry); return retry; }
      return null;
    }
  }

  /**
   * 특정 지역(lawdCd)의 특정 월 실거래 데이터를 수집해 DB에 저장
   * - MOLIT API는 구/군 단위로 응답 → 같은 구/군 내 모든 동을 함께 저장
   * - DB에 없는 동은 자동으로 생성 (신규 지역 자동 시딩)
   */
  async collectByRegionAndMonth(lawdCd: string, dealYmd: string): Promise<number> {
    const region = await this.prisma.region.findUnique({ where: { lawdCd } });
    if (!region) {
      this.logger.warn(`Region not found: ${lawdCd}`);
      return 0;
    }

    const { sigunguCode, sigunguName, sidoName } = region;

    const [villaRaw, officetelRaw] = await Promise.all([
      this.molit.fetchVillaTransactions(sigunguCode, dealYmd),
      this.molit.fetchOfficetelTransactions(sigunguCode, dealYmd),
    ]);

    // 구/군 내 region 캐시 (DB 조회 최소화)
    const regionCache = new Map<string, { id: string; sidoName: string; sigunguName: string; dongName: string }>();
    let saved = 0;

    const saveItems = async (items: typeof villaRaw, type: PropertyType) => {
      for (const item of items) {
        try {
          const buildingName = item.mhouseNm || item.offiNm || '건물명 없음';
          const dealAmount = this.molit.parseDealAmount(item.dealAmount || '0');
          const exclusiveArea = parseFloat(item.excluUseAr || '0');
          if (dealAmount <= 0 || exclusiveArea <= 0) continue;

          const pricePerPyeong = this.molit.calcPricePerPyeong(dealAmount, exclusiveArea);
          const floor = parseInt(item.floor || '1', 10);
          const buildYear = parseInt(item.buildYear || '0', 10);
          const dongName = (item.umdNm || '').trim();
          const jibunStr = item.jibun || '';

          const year = item.dealYear || dealYmd.slice(0, 4);
          const month = (item.dealMonth || dealYmd.slice(4, 6)).toString().padStart(2, '0');
          const day = (item.dealDay || '1').toString().padStart(2, '0');
          const dealDate = new Date(`${year}-${month}-${day}`);

          // 동 이름으로 region 조회 or 자동 생성
          const targetRegion = dongName
            ? await this.getOrCreateRegion(sigunguCode, sigunguName, sidoName, dongName, regionCache)
            : region;
          if (!targetRegion) continue;

          const jibunAddress = [sidoName, sigunguName, dongName || region.dongName, jibunStr]
            .filter(Boolean).join(' ');

          await this.prisma.realTransaction.upsert({
            where: {
              regionId_buildingName_dealDate_dealAmount_floor: {
                regionId: targetRegion.id,
                buildingName,
                dealDate,
                dealAmount,
                floor,
              },
            },
            update: {},
            create: {
              regionId: targetRegion.id,
              buildingName,
              dealDate,
              dealAmount,
              exclusiveArea,
              pricePerPyeong,
              floor,
              buildYear,
              propertyType: type,
              jibunAddress,
              roadAddress: '',
              rawData: item as object,
            },
          });
          saved++;
        } catch (e) {
          this.logger.warn(`저장 실패: ${(e as Error).message}`);
        }
      }
    };

    await saveItems(villaRaw, PropertyType.villa);
    await saveItems(officetelRaw, PropertyType.officetel);

    this.logger.log(`[${lawdCd}] ${dealYmd} 수집 완료: ${saved}건`);
    return saved;
  }

  /**
   * 특정 지역의 최근 N개월 데이터를 일괄 수집
   */
  async collectRecent(lawdCd: string, months = 12): Promise<{ total: number; months: string[] }> {
    const collected: string[] = [];
    let total = 0;

    for (let i = 0; i < months; i++) {
      const date = subMonths(new Date(), i);
      const dealYmd = format(date, 'yyyyMM');
      const count = await this.collectByRegionAndMonth(lawdCd, dealYmd);
      if (count > 0) collected.push(dealYmd);
      total += count;
    }

    return { total, months: collected };
  }

  /**
   * 인천광역시 전체 구/군 시딩 + 트랜잭션 수집
   * MOLIT API에서 동 목록 발견 → regions 자동 생성 → real_transactions 저장
   */
  async seedIncheon(months = 12): Promise<{ newRegions: number; newTransactions: number; details: string[] }> {
    const INCHEON_SIGUNGUS = [
      { code: '28110', name: '중구' },
      { code: '28140', name: '동구' },
      { code: '28177', name: '미추홀구' },
      { code: '28185', name: '연수구' },
      { code: '28200', name: '남동구' },
      { code: '28237', name: '부평구' },
      { code: '28245', name: '계양구' },
      { code: '28260', name: '서구' },
      { code: '28710', name: '강화군' },
      { code: '28720', name: '옹진군' },
    ];

    let newRegions = 0;
    let newTransactions = 0;
    const details: string[] = [];

    for (const sg of INCHEON_SIGUNGUS) {
      let sgRegions = 0;
      let sgTx = 0;

      for (let i = 0; i < months; i++) {
        const dealYmd = format(subMonths(new Date(), i), 'yyyyMM');

        const [villas, offis] = await Promise.all([
          this.molit.fetchVillaTransactions(sg.code, dealYmd),
          this.molit.fetchOfficetelTransactions(sg.code, dealYmd),
        ]);

        for (const [items, propType] of [
          [villas, PropertyType.villa],
          [offis, PropertyType.officetel],
        ] as const) {
          for (const item of items) {
            const dongName = (item.umdNm || '').trim();
            if (!dongName) continue;

            // 1. region 조회 또는 생성
            let region = await this.prisma.region.findFirst({
              where: { sigunguCode: sg.code, dongName },
            });

            if (!region) {
              // 사용 중인 dongCode 조회
              const used = await this.prisma.region.findMany({
                where: { sigunguCode: sg.code },
                select: { dongCode: true },
              });
              const usedCodes = new Set(used.map((r) => r.dongCode));

              // 해시 기반 고유 dongCode 생성
              let h = 0;
              for (const c of dongName + sg.code) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
              let dongCode = (100 + (h % 899)).toString().padStart(3, '0');
              while (usedCodes.has(dongCode)) {
                h = (h + 1) & 0xffff;
                dongCode = (100 + (h % 899)).toString().padStart(3, '0');
              }

              const lawdCd = sg.code + dongCode + '00';
              try {
                region = await this.prisma.region.create({
                  data: {
                    lawdCd,
                    sidoCode: '28',
                    sigunguCode: sg.code,
                    dongCode,
                    sidoName: '인천광역시',
                    sigunguName: sg.name,
                    dongName,
                  },
                });
                sgRegions++;
                newRegions++;
              } catch {
                // 동시 생성 충돌 → 재조회
                region = await this.prisma.region.findFirst({
                  where: { sigunguCode: sg.code, dongName },
                });
                if (!region) continue;
              }
            }

            // 2. transaction 저장
            const dealAmount = this.molit.parseDealAmount(item.dealAmount || '0');
            const exclusiveArea = parseFloat(item.excluUseAr || '0');
            if (dealAmount <= 0 || exclusiveArea <= 0) continue;

            const buildingName = item.mhouseNm || item.offiNm || '건물명없음';
            const year = item.dealYear || dealYmd.slice(0, 4);
            const month = (item.dealMonth || dealYmd.slice(4, 6)).toString().padStart(2, '0');
            const day = (item.dealDay || '1').toString().padStart(2, '0');
            const dealDate = new Date(`${year}-${month}-${day}`);
            const floor = parseInt(item.floor || '1', 10);

            try {
              await this.prisma.realTransaction.upsert({
                where: {
                  regionId_buildingName_dealDate_dealAmount_floor: {
                    regionId: region.id,
                    buildingName,
                    dealDate,
                    dealAmount,
                    floor,
                  },
                },
                update: {},
                create: {
                  regionId: region.id,
                  buildingName,
                  dealDate,
                  dealAmount,
                  exclusiveArea,
                  pricePerPyeong: this.molit.calcPricePerPyeong(dealAmount, exclusiveArea),
                  floor,
                  buildYear: parseInt(item.buildYear || '0', 10),
                  propertyType: propType,
                  jibunAddress: `인천광역시 ${sg.name} ${dongName} ${item.jibun || ''}`.trim(),
                  roadAddress: '',
                  rawData: item as object,
                },
              });
              sgTx++;
              newTransactions++;
            } catch { /* upsert conflict = already exists */ }
          }
        }

        // MOLIT API rate limit 방지
        await new Promise((r) => setTimeout(r, 300));
      }

      const msg = `${sg.name}: 동 ${sgRegions}개 신규, 거래 ${sgTx}건`;
      details.push(msg);
      this.logger.log(`[인천 시딩] ${msg}`);
    }

    return { newRegions, newTransactions, details };
  }
}
