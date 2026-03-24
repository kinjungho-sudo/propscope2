import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RegionsModule } from './regions/regions.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ListingsModule } from './listings/listings.module';
import { ReportsModule } from './reports/reports.module';
import { ConstructionsModule } from './constructions/constructions.module';
import { MolitModule } from './molit/molit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RegionsModule,
    TransactionsModule,
    ListingsModule,
    ReportsModule,
    ConstructionsModule,
    MolitModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
