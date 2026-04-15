import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CollectorService } from './collector.service';

@ApiTags('collector')
@Controller('collector')
export class CollectorController {
  constructor(private readonly collector: CollectorService) {}

  @Post('collect')
  @ApiOperation({ summary: '특정 지역 + 월 데이터 수집' })
  @ApiBody({
    schema: {
      example: { lawdCd: '1168010100', dealYmd: '202503' },
      properties: {
        lawdCd: { type: 'string', description: '법정동코드 10자리' },
        dealYmd: { type: 'string', description: 'YYYYMM 형식' },
      },
    },
  })
  async collectOne(@Body() body: { lawdCd: string; dealYmd: string }) {
    const count = await this.collector.collectByRegionAndMonth(body.lawdCd, body.dealYmd);
    return { saved: count, lawdCd: body.lawdCd, dealYmd: body.dealYmd };
  }

  @Post('seed-incheon')
  @ApiOperation({ summary: '인천광역시 전체 동 시딩 + 트랜잭션 수집 (months 기본 12, 최대 36)' })
  async seedIncheon(@Body() body: { months?: number }) {
    return this.collector.seedIncheon(body?.months ?? 12);
  }

  @Post('geocode-regions')
  @ApiOperation({ summary: 'null 좌표 지역 Kakao REST API 일괄 지오코딩 (KAKAO_REST_API_KEY 필요)' })
  @ApiBody({
    schema: {
      example: { sidoFilter: '인천' },
      properties: { sidoFilter: { type: 'string', description: '시/도 이름 필터 (없으면 전체)' } },
    },
  })
  async geocodeRegions(@Body() body: { sidoFilter?: string }) {
    return this.collector.geocodeNullRegions(body?.sidoFilter);
  }

  @Post('collect-recent')
  @ApiOperation({ summary: '특정 지역 최근 N개월 일괄 수집' })
  @ApiBody({
    schema: {
      example: { lawdCd: '1168010100', months: 12 },
      properties: {
        lawdCd: { type: 'string', description: '법정동코드 10자리' },
        months: { type: 'number', description: '수집할 개월 수 (기본 12)' },
      },
    },
  })
  async collectRecent(@Body() body: { lawdCd: string; months?: number }) {
    const result = await this.collector.collectRecent(body.lawdCd, body.months ?? 12);
    return result;
  }
}
