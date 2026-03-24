import { Module } from '@nestjs/common';
import { ConstructionsController } from './constructions.controller';
import { ConstructionsService } from './constructions.service';

@Module({
  controllers: [ConstructionsController],
  providers: [ConstructionsService],
})
export class ConstructionsModule {}
