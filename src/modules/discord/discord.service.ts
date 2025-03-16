import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import { DiscordWidgetResponse, ErrorResponse } from '../../types/api.types';

@Injectable()
export class DiscordService {
  private readonly baseUrl = 'https://discord.com/api';

  constructor(private readonly httpService: HttpService) {}

  private getErrorMessage(error: AxiosError<ErrorResponse>): string {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.data?.message ||
      error.response?.data?.data?.error ||
      'Failed to fetch Discord data'
    );
  }

  async getServerWidget(serverId: string): Promise<DiscordWidgetResponse> {
    const url = `${this.baseUrl}/guilds/${serverId}/widget.json`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<DiscordWidgetResponse>(url).pipe(
          map((response) => response),
          catchError((error: AxiosError<ErrorResponse>) => {
            if (error.response?.status === 404) {
              throw new HttpException(
                'Discord widget is not enabled for this server. Please enable it in server settings.',
                HttpStatus.NOT_FOUND,
              );
            }
            throw new HttpException(
              this.getErrorMessage(error),
              error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
      );

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch Discord data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
