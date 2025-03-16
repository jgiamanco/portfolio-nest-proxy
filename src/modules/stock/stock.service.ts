import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import {
  StockData,
  StockHistoryData,
  FinnhubQuoteResponse,
  ErrorResponse,
} from '../../types/api.types';

@Injectable()
export class StockService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://finnhub.io/api/v1';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('FINNHUB_API_KEY');
    if (!apiKey) {
      throw new Error(
        'FINNHUB_API_KEY is not defined in environment variables',
      );
    }
    this.apiKey = apiKey;
  }

  private getErrorMessage(error: AxiosError<ErrorResponse>): string {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.data?.message ||
      error.response?.data?.data?.error ||
      'Failed to fetch stock data'
    );
  }

  async getQuote(symbol: string): Promise<StockData> {
    try {
      const url = `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`;
      const { data } = await firstValueFrom(
        this.httpService.get<FinnhubQuoteResponse>(url).pipe(
          map((response) => response),
          catchError((error: AxiosError<ErrorResponse>) => {
            throw new HttpException(
              this.getErrorMessage(error),
              error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
      );

      return {
        symbol,
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        lastUpdated: new Date().toISOString(),
        timestamp: Date.now(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch stock data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getHistoricalData(
    symbol: string,
    resolution: string,
    from: number,
    to: number,
  ): Promise<StockHistoryData> {
    try {
      const url = `${this.baseUrl}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`;
      const { data } = await firstValueFrom(
        this.httpService.get<{ c: number[]; t: number[] }>(url).pipe(
          map((response) => response),
          catchError((error: AxiosError<ErrorResponse>) => {
            throw new HttpException(
              this.getErrorMessage(error),
              error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
      );

      const prices = data.c;
      const timestamps = data.t;
      const historicalData = timestamps.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString(),
        price: prices[index],
      }));

      return {
        day: historicalData.slice(-24),
        week: historicalData.slice(-7 * 24),
        month: historicalData,
        symbol,
        timestamp: Date.now(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch historical stock data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
