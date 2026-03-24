import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string) {
    if (!q || q.trim().length < 1) return [];

    const results = await this.prisma.region.findMany({
      where: {
        OR: [
          { dongName: { contains: q, mode: 'insensitive' } },
          { sigunguName: { contains: q, mode: 'insensitive' } },
          { sidoName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: [{ sidoName: 'asc' }, { sigunguName: 'asc' }, { dongName: 'asc' }],
    });

    return results.map((r) => ({
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
    }));
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
