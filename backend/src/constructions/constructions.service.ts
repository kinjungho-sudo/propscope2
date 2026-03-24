import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConstructionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByRegion(regionId: string) {
    const region = await this.prisma.region.findFirst({
      where: { OR: [{ id: regionId }, { lawdCd: regionId }] },
    });
    if (!region) return [];

    return this.prisma.newConstruction.findMany({
      where: { regionId: region.id },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
