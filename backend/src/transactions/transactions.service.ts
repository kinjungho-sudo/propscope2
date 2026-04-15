import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { PropertyType, Prisma } from '@prisma/client';
import { subMonths, startOfMonth, format } from 'date-fns';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findRegion(regionId: string) {
    return this.prisma.region.findFirst({
      where: { OR: [{ id: regionId }, { lawdCd: regionId }] },
    });
  }

  /** 건물명을 해시해서 ±0.003도 범위의 결정적 오프셋 생성 (동일 건물 = 항상 같은 위치) */
  private jitter(str: string, salt: number): number {
    let h = salt;
    for (const c of str) h = ((h * 31) + c.charCodeAt(0)) & 0x7fffffff;
    return ((h % 600) - 300) / 100000; // ±0.003° ≈ ±300m
  }

  async findAll(filters: TransactionFilterDto) {
    const {
      regionId,
      propertyType,
      periodMonths = 12,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      minBuildYear,
      maxBuildYear,
      sort = 'dealDate',
      order = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    const region = await this.findRegion(regionId);
    if (!region) {
      return { transactions: [], pagination: { page, limit, totalCount: 0, totalPages: 0 } };
    }

    const fromDate = subMonths(new Date(), periodMonths);

    const where: Prisma.RealTransactionWhereInput = {
      regionId: region.id,
      dealDate: { gte: fromDate },
      ...(propertyType && propertyType !== 'all' && { propertyType: propertyType as PropertyType }),
      ...(minPrice !== undefined && { dealAmount: { gte: minPrice } }),
      ...(maxPrice !== undefined && { dealAmount: { lte: maxPrice } }),
      ...(minArea !== undefined && { exclusiveArea: { gte: minArea } }),
      ...(maxArea !== undefined && { exclusiveArea: { lte: maxArea } }),
      ...(minBuildYear !== undefined && { buildYear: { gte: minBuildYear } }),
      ...(maxBuildYear !== undefined && { buildYear: { lte: maxBuildYear } }),
    };

    const orderMap: Record<string, Prisma.RealTransactionOrderByWithRelationInput> = {
      dealDate: { dealDate: order as 'asc' | 'desc' },
      price: { dealAmount: order as 'asc' | 'desc' },
      pricePerPyeong: { pricePerPyeong: order as 'asc' | 'desc' },
      area: { exclusiveArea: order as 'asc' | 'desc' },
    };

    const [totalCount, transactions] = await Promise.all([
      this.prisma.realTransaction.count({ where }),
      this.prisma.realTransaction.findMany({
        where,
        orderBy: orderMap[sort] || { dealDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      transactions: transactions.map((t) => {
        // MOLIT API는 GPS 좌표를 제공하지 않아 t.lat/lng가 항상 null
        // → region 좌표를 폴백으로 사용하고 건물명 해시로 위치를 분산
        const lat = t.lat ?? (region.lat != null ? region.lat + this.jitter(t.buildingName, 1) : null);
        const lng = t.lng ?? (region.lng != null ? region.lng + this.jitter(t.buildingName, 2) : null);
        return {
          id: t.id,
          buildingName: t.buildingName,
          dealDate: format(t.dealDate, 'yyyy-MM-dd'),
          dealAmount: t.dealAmount,
          exclusiveArea: t.exclusiveArea,
          pricePerPyeong: t.pricePerPyeong,
          floor: t.floor,
          buildYear: t.buildYear,
          propertyType: t.propertyType,
          address: t.jibunAddress || t.roadAddress || '',
          lat,
          lng,
        };
      }),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getStats(regionId: string, propertyType?: string) {
    const region = await this.findRegion(regionId);
    if (!region) return null;

    const fromDate = subMonths(new Date(), 12);
    const prevMonthStart = startOfMonth(subMonths(new Date(), 2));
    const currMonthStart = startOfMonth(subMonths(new Date(), 1));

    const calcStats = async (type?: PropertyType) => {
      const where: Prisma.RealTransactionWhereInput = {
        regionId: region.id,
        dealDate: { gte: fromDate },
        ...(type && { propertyType: type }),
      };

      const [transactions, prevMonth, currMonth] = await Promise.all([
        this.prisma.realTransaction.findMany({
          where,
          select: { dealAmount: true, pricePerPyeong: true },
        }),
        this.prisma.realTransaction.aggregate({
          where: { ...where, dealDate: { gte: prevMonthStart, lt: currMonthStart } },
          _avg: { dealAmount: true },
        }),
        this.prisma.realTransaction.aggregate({
          where: { ...where, dealDate: { gte: currMonthStart } },
          _avg: { dealAmount: true },
        }),
      ]);

      if (transactions.length === 0) {
        return { avgPrice: 0, avgPricePerPyeong: 0, maxPrice: 0, minPrice: 0, transactionCount: 0, monthOverMonthChange: 0 };
      }

      const amounts = transactions.map((t) => t.dealAmount);
      const avgPrice = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length);
      const avgPricePerPyeong = Math.round(
        transactions.reduce((a, t) => a + t.pricePerPyeong, 0) / transactions.length,
      );
      const prevAvg = prevMonth._avg.dealAmount ?? avgPrice;
      const currAvg = currMonth._avg.dealAmount ?? avgPrice;
      const monthOverMonthChange = prevAvg ? ((currAvg - prevAvg) / prevAvg) * 100 : 0;

      return {
        avgPrice,
        avgPricePerPyeong,
        maxPrice: Math.max(...amounts),
        minPrice: Math.min(...amounts),
        transactionCount: transactions.length,
        monthOverMonthChange: Math.round(monthOverMonthChange * 10) / 10,
      };
    };

    const [villaStats, offiStats] = await Promise.all([
      calcStats(PropertyType.villa),
      calcStats(PropertyType.officetel),
    ]);

    return {
      regionName: `${region.sidoName} ${region.sigunguName} ${region.dongName}`,
      period: `${format(fromDate, 'yyyy-MM')} ~ ${format(new Date(), 'yyyy-MM')}`,
      villa: villaStats,
      officetel: offiStats,
    };
  }

  async getTrend(regionId: string, months: number, propertyType?: string) {
    const region = await this.findRegion(regionId);
    if (!region) return [];

    const fromDate = subMonths(new Date(), months);
    const where: Prisma.RealTransactionWhereInput = {
      regionId: region.id,
      dealDate: { gte: fromDate },
      ...(propertyType && propertyType !== 'all' && { propertyType: propertyType as PropertyType }),
    };

    const transactions = await this.prisma.realTransaction.findMany({
      where,
      select: { dealDate: true, dealAmount: true, pricePerPyeong: true },
      orderBy: { dealDate: 'asc' },
    });

    const monthlyMap = new Map<string, { amounts: number[]; ppyeongs: number[] }>();
    for (const t of transactions) {
      const month = format(t.dealDate, 'yyyy-MM');
      if (!monthlyMap.has(month)) monthlyMap.set(month, { amounts: [], ppyeongs: [] });
      monthlyMap.get(month)!.amounts.push(t.dealAmount);
      monthlyMap.get(month)!.ppyeongs.push(t.pricePerPyeong);
    }

    return Array.from(monthlyMap.entries()).map(([month, { amounts, ppyeongs }]) => ({
      month,
      avgPrice: Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length),
      avgPricePerPyeong: Math.round(ppyeongs.reduce((a, b) => a + b, 0) / ppyeongs.length),
      transactionCount: amounts.length,
    }));
  }

  async getAnalysis(regionId: string, propertyType?: string) {
    const region = await this.findRegion(regionId);
    if (!region) return null;

    const fromDate = subMonths(new Date(), 60);
    const where: Prisma.RealTransactionWhereInput = {
      regionId: region.id,
      dealDate: { gte: fromDate },
      ...(propertyType && propertyType !== 'all' && { propertyType: propertyType as PropertyType }),
    };

    const transactions = await this.prisma.realTransaction.findMany({
      where,
      select: { dealAmount: true, exclusiveArea: true, buildYear: true, floor: true },
    });

    const areaBuckets: Record<string, number> = { '~20㎡': 0, '20~40㎡': 0, '40~60㎡': 0, '60~85㎡': 0, '85㎡~': 0 };
    const buildYearBuckets: Record<string, number[]> = {};
    const floorBuckets: Record<string, number[]> = {};

    for (const t of transactions) {
      if (t.exclusiveArea < 20) areaBuckets['~20㎡']++;
      else if (t.exclusiveArea < 40) areaBuckets['20~40㎡']++;
      else if (t.exclusiveArea < 60) areaBuckets['40~60㎡']++;
      else if (t.exclusiveArea < 85) areaBuckets['60~85㎡']++;
      else areaBuckets['85㎡~']++;

      const decade = `${Math.floor(t.buildYear / 10) * 10}년대`;
      if (!buildYearBuckets[decade]) buildYearBuckets[decade] = [];
      buildYearBuckets[decade].push(t.dealAmount);

      const floorRange = t.floor <= 3 ? '저층(1~3층)' : t.floor <= 7 ? '중층(4~7층)' : '고층(8층+)';
      if (!floorBuckets[floorRange]) floorBuckets[floorRange] = [];
      floorBuckets[floorRange].push(t.dealAmount);
    }

    return {
      areaDistribution: Object.entries(areaBuckets).map(([range, count]) => ({ range, count })),
      buildYearAnalysis: Object.entries(buildYearBuckets).map(([decade, amounts]) => ({
        decade,
        avgPrice: Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length),
        count: amounts.length,
      })),
      floorAnalysis: Object.entries(floorBuckets).map(([range, amounts]) => ({
        range,
        avgPrice: Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length),
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        count: amounts.length,
      })),
    };
  }
}
