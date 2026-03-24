import { Controller, Get, Query } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @ApiOperation({ summary: '매물 목록 조회' })
  findAll(
    @Query('regionId') regionId: string,
    @Query('propertyType') propertyType?: string,
  ) {
    return this.listingsService.findAll(regionId, propertyType);
  }
}
