import { Controller, Get, Query } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockData, StockHistoryData } from '../../types/api.types';

@Controller('api/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('quote')
  async getQuote(@Query('symbol') symbol: string): Promise<StockData> {
    return await this.stockService.getQuote(symbol);
  }

  @Get('historical')
  async getHistoricalData(
    @Query('symbol') symbol: string,
    @Query('resolution') resolution: string,
    @Query('from') from: number,
    @Query('to') to: number,
  ): Promise<StockHistoryData> {
    return await this.stockService.getHistoricalData(
      symbol,
      resolution,
      from,
      to,
    );
  }
}
