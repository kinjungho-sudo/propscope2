import { Controller, Get, Param, Query } from '@nestjs/common';
import { RegionsService } from './regions.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('regions')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get('search')
  @ApiOperation({ summary: '지역 검색 (자동완성)' })
  search(@Query('q') q: string) {
    return this.regionsService.search(q);
  }

  @Get(':regionId')
  @ApiOperation({ summary: '지역 상세 정보' })
  findOne(@Param('regionId') regionId: string) {
    return this.regionsService.findOne(regionId);
  }
}
