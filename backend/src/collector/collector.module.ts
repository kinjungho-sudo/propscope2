import { Module } from '@nestjs/common';
import { CollectorService } from './collector.service';
import { CollectorController } from './collector.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MolitModule } from '../molit/molit.module';

@Module({
  imports: [PrismaModule, MolitModule],
  controllers: [CollectorController],
  providers: [CollectorService],
  exports: [CollectorService],
})
export class CollectorModule {}
