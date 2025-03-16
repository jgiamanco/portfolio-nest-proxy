import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WeatherData } from '../../types/api.types';
import { catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import { OpenWeatherResponse, ErrorResponse } from '../../types/api.types';

@Injectable()
export class WeatherService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENWEATHER_API_KEY');
    if (!apiKey) {
      throw new Error(
        'OPENWEATHER_API_KEY is not defined in environment variables',
      );
    }
    this.apiKey = apiKey;
  }

  private getErrorMessage(error: AxiosError<ErrorResponse>): string {
    if (error.response?.status === 404) {
      return 'Location not found';
    }
    if (error.response?.status === 401) {
      return 'Invalid API key';
    }
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.data?.message ||
      error.response?.data?.data?.error ||
      'Failed to fetch weather data'
    );
  }

  private mapWeatherResponse(data: OpenWeatherResponse): WeatherData {
    if (!data || !data.main || !data.weather || data.weather.length === 0) {
      throw new BadRequestException('Invalid weather data received from API');
    }

    return {
      temperature: data.main.temp,
      condition: data.weather[0].main.toLowerCase(),
      location: `${data.name}, ${data.sys.country}`,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      windSpeed: data.wind.speed,
    };
  }

  async getWeather(location: string): Promise<WeatherData> {
    const url = `${this.baseUrl}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=imperial`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<OpenWeatherResponse>(url).pipe(
          map((response) => response),
          catchError((error: AxiosError<ErrorResponse>) => {
            const errorMessage = this.getErrorMessage(error);
            const status =
              error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

            if (status === 404) {
              throw new BadRequestException(errorMessage);
            }

            throw new HttpException(errorMessage, status);
          }),
        ),
      );

      return this.mapWeatherResponse(data);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Weather Service Error:', error);
      throw new HttpException(
        'Failed to fetch weather data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getWeatherByLocation(lat: number, lon: number): Promise<WeatherData> {
    try {
      const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=imperial`;
      const { data } = await firstValueFrom(
        this.httpService.get<OpenWeatherResponse>(url).pipe(
          map((response) => response),
          catchError((error: AxiosError<ErrorResponse>) => {
            const errorMessage = this.getErrorMessage(error);
            const status =
              error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
            throw new HttpException(errorMessage, status);
          }),
        ),
      );

      return this.mapWeatherResponse(data);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Weather Service Error:', error);
      throw new HttpException(
        'Failed to fetch weather data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
