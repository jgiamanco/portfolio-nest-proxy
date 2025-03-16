import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SportsController } from './sports.controller';
import { SportsService } from './sports.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [SportsController],
  providers: [SportsService],
})
export class SportsModule {}
