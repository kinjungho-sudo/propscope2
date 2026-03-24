import { Controller, Get, Param } from '@nestjs/common';
import { ConstructionsService } from './constructions.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('constructions')
@Controller('constructions')
export class ConstructionsController {
  constructor(private readonly constructionsService: ConstructionsService) {}

  @Get(':regionId')
  @ApiOperation({ summary: '신축 분양률 조회' })
  findByRegion(@Param('regionId') regionId: string) {
    return this.constructionsService.findByRegion(regionId);
  }
}
