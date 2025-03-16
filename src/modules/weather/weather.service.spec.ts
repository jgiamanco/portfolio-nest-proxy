import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WeatherService } from './weather.service';
import { of, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-api-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
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

    service = module.get<WeatherService>(WeatherService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWeatherByLocation', () => {
    const mockWeatherResponse = {
      main: {
        temp: 72.5,
      },
      weather: [
        {
          description: 'clear sky',
          icon: '01d',
        },
      ],
      name: 'San Diego',
    };

    it('should return weather data', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of({
          data: mockWeatherResponse,
        }),
      );

      const result = await service.getWeatherByLocation(32.7157, -117.1611);

      expect(result).toEqual({
        temperature: 73, // rounded from 72.5
        description: 'clear sky',
        icon: '01d',
        location: 'San Diego',
        timestamp: expect.any(Number),
      });
    });

    it('should handle API errors', async () => {
      mockHttpService.get.mockReturnValueOnce(
        throwError(() => ({
          response: {
            status: 404,
            data: { message: 'Location not found' },
          },
        })),
      );

      await expect(service.getWeatherByLocation(0, 0)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('getWeather', () => {
    const mockWeatherResponse = {
      main: {
        temp: 20, // Celsius
        feels_like: 18,
        humidity: 65,
      },
      weather: [
        {
          main: 'Clear',
          description: 'clear sky',
        },
      ],
      wind: {
        speed: 5.5,
      },
      name: 'San Diego',
      sys: {
        country: 'US',
      },
      timezone: -25200,
    };

    it('should return weather data by city name', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of({
          data: mockWeatherResponse,
        }),
      );

      const result = await service.getWeather('San Diego');

      expect(result).toEqual(mockWeatherResponse);
    });

    it('should handle API errors', async () => {
      mockHttpService.get.mockReturnValueOnce(
        throwError(() => ({
          response: {
            status: 404,
            data: { message: 'City not found' },
          },
        })),
      );

      await expect(service.getWeather('NonexistentCity')).rejects.toThrow(
        HttpException,
      );
    });
  });
});
