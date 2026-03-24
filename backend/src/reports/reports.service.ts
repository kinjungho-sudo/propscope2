import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Response } from 'express';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { regionId: string; buildingName?: string; transactionIds: string[] }) {
    // TODO: Implement Puppeteer PDF generation in Phase 2
    return { reportId: `report_${Date.now()}`, message: 'PDF 생성 기능은 Phase 2에서 구현됩니다.' };
  }

  async findAll() {
    return this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async download(reportId: string, res: Response) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    res.json({ message: '다운로드 기능 Phase 2 구현 예정', report });
  }
}
