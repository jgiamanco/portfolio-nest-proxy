import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { StockService } from './stock.service';
import { of, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';

describe('StockService', () => {
  let service: StockService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-api-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuote', () => {
    const mockQuoteResponse = {
      c: 150.5, // Current price
      d: 2.5, // Change
      dp: 1.67, // Percent change
    };

    it('should return stock quote data', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of({
          data: mockQuoteResponse,
        }),
      );

      const result = await service.getQuote('AAPL');

      expect(result).toEqual({
        symbol: 'AAPL',
        price: 150.5,
        change: 2.5,
        changePercent: 1.67,
        lastUpdated: expect.any(String) as string,
        timestamp: expect.any(Number) as number,
      });
    });

    it('should handle API errors', async () => {
      mockHttpService.get.mockReturnValueOnce(
        throwError(() => ({
          response: {
            status: 404,
            data: { message: 'Stock not found' },
          },
        })),
      );

      await expect(service.getQuote('INVALID')).rejects.toThrow(HttpException);
    });
  });

  describe('getHistoricalData', () => {
    const mockHistoricalResponse = {
      c: [150.5, 151.2, 149.8], // Close prices
      t: [1625097600, 1625184000, 1625270400], // Timestamps
    };

    it('should return historical stock data', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of({
          data: mockHistoricalResponse,
        }),
      );

      const result = await service.getHistoricalData(
        'AAPL',
        'D',
        1625097600,
        1625270400,
      );

      expect(result).toEqual({
        day: expect.any(Array) as number[],
        week: expect.any(Array) as number[],
        month: expect.arrayContaining([
          {
            date: expect.any(String) as string,
            price: expect.any(Number) as number,
          },
        ]) as Array<{ date: string; price: number }>,
        symbol: 'AAPL',
        timestamp: expect.any(Number) as number,
      });
    });

    it('should handle API errors', async () => {
      mockHttpService.get.mockReturnValueOnce(
        throwError(() => ({
          response: {
            status: 500,
            data: { message: 'Internal server error' },
          },
        })),
      );

      await expect(
        service.getHistoricalData('AAPL', 'D', 1625097600, 1625270400),
      ).rejects.toThrow(HttpException);
    });
  });
});
