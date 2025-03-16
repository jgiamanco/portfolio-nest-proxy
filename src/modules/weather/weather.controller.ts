import {
  Controller,
  Get,
  Query,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherData } from '../../types/api.types';

@Controller('api/weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getWeather(@Query('location') location: string): Promise<WeatherData> {
    if (!location || location.trim() === '') {
      throw new BadRequestException('Location parameter is required');
    }

    try {
      return await this.weatherService.getWeather(location.trim());
    } catch (error) {
      // Re-throw NestJS HTTP exceptions
      if (error instanceof HttpException) {
        throw error;
      }
      // Log the error for debugging
      console.error('Weather API Error:', error);
      throw new BadRequestException(
        'Invalid location or unable to fetch weather data',
      );
    }
  }
}
