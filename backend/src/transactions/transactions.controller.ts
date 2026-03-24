import { Controller, Get, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: '실거래가 목록 조회' })
  findAll(@Query() filters: TransactionFilterDto) {
    return this.transactionsService.findAll(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: '동네 평균 시세 통계' })
  getStats(
    @Query('regionId') regionId: string,
    @Query('propertyType') propertyType?: string,
  ) {
    return this.transactionsService.getStats(regionId, propertyType);
  }

  @Get('trend')
  @ApiOperation({ summary: '시세 추이 데이터' })
  getTrend(
    @Query('regionId') regionId: string,
    @Query('months') months?: string,
    @Query('propertyType') propertyType?: string,
  ) {
    return this.transactionsService.getTrend(regionId, Number(months) || 12, propertyType);
  }

  @Get('analysis')
  @ApiOperation({ summary: '실거래가 종합 분석' })
  getAnalysis(
    @Query('regionId') regionId: string,
    @Query('propertyType') propertyType?: string,
  ) {
    return this.transactionsService.getAnalysis(regionId, propertyType);
  }
}
