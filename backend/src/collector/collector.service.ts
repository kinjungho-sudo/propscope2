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
   * 특정 지역(lawdCd)의 특정 월 실거래 데이터를 수집해 DB에 저장
   * dealYmd: 'YYYYMM' 형식 (예: '202503')
   */
  async collectByRegionAndMonth(lawdCd: string, dealYmd: string): Promise<number> {
    const region = await this.prisma.region.findUnique({ where: { lawdCd } });
    if (!region) {
      this.logger.warn(`Region not found: ${lawdCd}`);
      return 0;
    }

    // MOLIT LAWD_CD = 시군구 코드 (5자리)
    const sigunguCode = region.sigunguCode;

    const [villaRaw, officetelRaw] = await Promise.all([
      this.molit.fetchVillaTransactions(sigunguCode, dealYmd),
      this.molit.fetchOfficetelTransactions(sigunguCode, dealYmd),
    ]);

    let saved = 0;

    const saveItems = async (items: typeof villaRaw, type: PropertyType) => {
      for (const item of items) {
        try {
          // 빌라(mhouseNm) / 오피스텔(offiNm) — 두 API 모두 영문 필드
          const buildingName = item.mhouseNm || item.offiNm || '건물명 없음';
          const dealAmount = this.molit.parseDealAmount(item.dealAmount || '0');
          const exclusiveArea = parseFloat(item.excluUseAr || '0');
          const pricePerPyeong = this.molit.calcPricePerPyeong(dealAmount, exclusiveArea);
          const floor = parseInt(item.floor || '0', 10);
          const buildYear = parseInt(item.buildYear || '0', 10);
          const dongName = (item.umdNm || '').trim();
          const jibunStr = item.jibun || '';

          const year = item.dealYear || dealYmd.slice(0, 4);
          const month = (item.dealMonth || dealYmd.slice(4, 6)).toString().padStart(2, '0');
          const day = (item.dealDay || '1').toString().padStart(2, '0');
          const dealDate = new Date(`${year}-${month}-${day}`);

          // 동 이름으로 정확한 region 매핑 시도
          let targetRegion = region;
          if (dongName && dongName !== region.dongName) {
            const matched = await this.prisma.region.findFirst({
              where: { sigunguCode, dongName: { contains: dongName } },
            });
            if (matched) targetRegion = matched;
          }

          const jibunAddress = [
            targetRegion.sidoName,
            targetRegion.sigunguName,
            dongName || targetRegion.dongName,
            jibunStr,
          ]
            .filter(Boolean)
            .join(' ');

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
}
