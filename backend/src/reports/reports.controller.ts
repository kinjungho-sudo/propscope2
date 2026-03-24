import { Controller, Get, Post, Param, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: '감정 리포트 생성 요청' })
  create(@Body() body: { regionId: string; buildingName?: string; transactionIds: string[] }) {
    return this.reportsService.create(body);
  }

  @Get()
  @ApiOperation({ summary: '리포트 생성 이력' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(':reportId')
  @ApiOperation({ summary: '리포트 다운로드' })
  download(@Param('reportId') reportId: string, @Res() res: Response) {
    return this.reportsService.download(reportId, res);
  }
}
