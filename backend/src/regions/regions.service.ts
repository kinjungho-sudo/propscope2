import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CachedResult {
  data: ReturnType<RegionsService['mapRegion']>[];
  expiresAt: number;
}

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly cache = new Map<string, CachedResult>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private mapRegion(r: {
    id: string; sidoCode: string; sigunguCode: string; dongCode: string;
    sidoName: string; sigunguName: string; dongName: string;
    lawdCd: string; lat: number | null; lng: number | null;
  }) {
    return {
      id: r.id,
      sidoCode: r.sidoCode,
      sigunguCode: r.sigunguCode,
      dongCode: r.dongCode,
      sidoName: r.sidoName,
      sigunguName: r.sigunguName,
      dongName: r.dongName,
      lawdCd: r.lawdCd,
      lat: r.lat,
      lng: r.lng,
      fullName: `${r.sidoName} ${r.sigunguName} ${r.dongName}`,
    };
  }

  async search(q: string) {
    if (!q || q.trim().length < 1) return [];

    const key = q.trim().toLowerCase();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    // 1차: dongName prefix search (B-tree 인덱스 활용, 빠름)
    let results = await this.prisma.region.findMany({
      where: { dongName: { startsWith: q, mode: 'insensitive' } },
      take: 20,
      orderBy: [{ sidoName: 'asc' }, { sigunguName: 'asc' }, { dongName: 'asc' }],
    });

    // 2차: 결과 부족 시 contains fallback (느리지만 포괄적)
    if (results.length < 5) {
      results = await this.prisma.region.findMany({
        where: {
          OR: [
            { dongName: { contains: q, mode: 'insensitive' } },
            { sigunguName: { startsWith: q, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: [{ sidoName: 'asc' }, { sigunguName: 'asc' }, { dongName: 'asc' }],
      });
    }

    const data = results.map((r) => this.mapRegion(r));
    this.cache.set(key, { data, expiresAt: Date.now() + this.CACHE_TTL });
    return data;
  }

  async findOne(regionId: string) {
    const region = await this.prisma.region.findFirst({
      where: { OR: [{ id: regionId }, { lawdCd: regionId }] },
    });
    if (!region) throw new NotFoundException('Region not found');

    return {
      ...region,
      fullName: `${region.sidoName} ${region.sigunguName} ${region.dongName}`,
    };
  }

  async findByLawdCd(lawdCd: string) {
    return this.prisma.region.findUnique({ where: { lawdCd } });
  }
}
