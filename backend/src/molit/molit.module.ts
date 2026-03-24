import { Module } from '@nestjs/common';
import { MolitService } from './molit.service';

@Module({
  providers: [MolitService],
  exports: [MolitService],
})
export class MolitModule {}
