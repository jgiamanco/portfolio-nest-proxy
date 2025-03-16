import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import {
  SportType,
  GameData,
  BaseGameData,
  LeagueGameData,
} from './sports.types';

interface ErrorResponse {
  message?: string;
}

@Injectable()
export class SportsService {
  private readonly apiKeys: Record<SportType, string>;
  private readonly baseUrls: Record<SportType, string>;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Initialize API keys
    this.apiKeys = {
      mlb: this.getRequiredConfig('SPORTSDATA_MLB_API_KEY'),
      nfl: this.getRequiredConfig('SPORTSDATA_NFL_API_KEY'),
      nhl: this.getRequiredConfig('SPORTSDATA_NHL_API_KEY'),
      nba: this.getRequiredConfig('SPORTSDATA_NBA_API_KEY'),
    };

    // Initialize base URLs
    this.baseUrls = {
      mlb: 'https://api.sportsdata.io/v3/mlb/scores/json/GamesByDate',
      nfl: 'https://api.sportsdata.io/v3/nfl/scores/json/ScoresByDate',
      nhl: 'https://api.sportsdata.io/v3/nhl/scores/json/GamesByDate',
      nba: 'https://api.sportsdata.io/v3/nba/scores/json/GamesByDate',
    };
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`${key} is not defined in environment variables`);
    }
    return value;
  }

  private getCurrentDateFormatted(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = date
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase();
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private transformGameData(data: unknown[], sport: SportType): GameData[] {
    switch (sport) {
      case 'mlb':
      case 'nhl': {
        return data.map((game) => {
          const baseGame = game as BaseGameData;
          console.log(baseGame);
          return {
            GameID: Date.now(), // Unique ID for each game
            DateTime: new Date().toISOString(),
            Status:
              baseGame.Status ||
              baseGame.status?.abstractGameState ||
              'Scheduled',
            AwayTeam:
              baseGame.AwayTeam || baseGame.teams?.away?.team?.name || '',
            HomeTeam:
              baseGame.HomeTeam || baseGame.teams?.home?.team?.name || '',
            AwayTeamScore:
              baseGame.AwayTeamScore ||
              baseGame.AwayTeamRuns ||
              baseGame.teams?.away?.score ||
              0,
            HomeTeamScore:
              baseGame.HomeTeamScore ||
              baseGame.HomeTeamRuns ||
              baseGame.teams?.home?.score ||
              0,
            Channel: '', // Add if available in your data
            StadiumDetails: '', // Add if available in your data
          };
        });
      }
      case 'nfl':
      case 'nba': {
        return data.map((game) => {
          const leagueGame = game as LeagueGameData;
          const competitors = leagueGame.competitions?.[0]?.competitors || [];
          const [awayTeam, homeTeam] = competitors;
          const completed =
            leagueGame.competitions?.[0]?.status?.type?.completed;

          return {
            GameID: Date.now(), // Unique ID for each game
            DateTime: new Date().toISOString(),
            Status: completed ? 'Final' : 'In Progress',
            AwayTeam: awayTeam?.team?.name || '',
            HomeTeam: homeTeam?.team?.name || '',
            AwayTeamScore: Number(awayTeam?.score || 0),
            HomeTeamScore: Number(homeTeam?.score || 0),
            Channel: '', // Add if available in your data
            StadiumDetails: '', // Add if available in your data
          };
        });
      }
      default:
        throw new Error('Invalid sport type');
    }
  }

  async getGames(sport: SportType): Promise<GameData[]> {
    if (!Object.keys(this.apiKeys).includes(sport)) {
      throw new Error('Invalid sport type');
    }

    const currentDate = this.getCurrentDateFormatted();
    const url = `${this.baseUrls[sport]}/${currentDate}?key=${this.apiKeys[sport]}`;

    try {
      const response = await firstValueFrom<unknown>(
        this.httpService.get<unknown>(url).pipe(
          map((response) => response.data),
          catchError((error: AxiosError<ErrorResponse>) => {
            throw new HttpException(
              error.response?.data?.message ||
                `Failed to fetch ${sport.toUpperCase()} games`,
              error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }),
        ),
      );

      return this.transformGameData(
        Array.isArray(response) ? response : [],
        sport,
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid sport type') {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch ${sport.toUpperCase()} games`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
