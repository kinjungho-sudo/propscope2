import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PropertyType } from '@prisma/client';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(regionId: string, propertyType?: string) {
    const region = await this.prisma.region.findFirst({
      where: { OR: [{ id: regionId }, { lawdCd: regionId }] },
    });
    if (!region) return { listings: [] };

    const listings = await this.prisma.listing.findMany({
      where: {
        regionId: region.id,
        isActive: true,
        ...(propertyType && propertyType !== 'all' && { propertyType: propertyType as PropertyType }),
      },
      orderBy: { fetchedAt: 'desc' },
      take: 100,
    });

    return { listings };
  }
}
