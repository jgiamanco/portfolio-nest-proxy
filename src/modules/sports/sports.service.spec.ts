import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SportsService } from './sports.service';
import { of, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';
import { SportType } from './sports.types';

describe('SportsService', () => {
  let service: SportsService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const keys: Record<string, string> = {
        SPORTSDATA_MLB_API_KEY: 'test-mlb-key',
        SPORTSDATA_NFL_API_KEY: 'test-nfl-key',
        SPORTSDATA_NHL_API_KEY: 'test-nhl-key',
        SPORTSDATA_NBA_API_KEY: 'test-nba-key',
      };
      return keys[key] || null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SportsService,
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

    service = module.get<SportsService>(SportsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGames', () => {
    const mockMLBResponse = [
      {
        GameID: 74183,
        Season: 2025,
        SeasonType: 2,
        Status: 'InProgress',
        DateTime: '2025-03-16T13:05:00',
        AwayTeam: 'PHI',
        HomeTeam: 'BAL',
        StadiumID: 49,
        Channel: 'ESPN',
        AwayTeamRuns: 2,
        HomeTeamRuns: 0,
        Inning: 6,
        InningHalf: 'M',
        InningDescription: 'Mid 6',
        LastPlay: 'Scrambled',
        Updated: '2025-03-16T14:48:12',
        IsClosed: false,
        DateTimeUTC: '2025-03-16T17:05:00',
        GlobalGameID: 10074183,
        NeutralVenue: false,
        SeriesInfo: null,
        Innings: [],
      },
    ];

    const mockNFLResponse = [
      {
        competitions: [
          {
            competitors: [
              { team: { name: 'Chiefs' }, score: '24' },
              { team: { name: 'Raiders' }, score: '17' },
            ],
            status: { type: { completed: true } },
          },
        ],
      },
    ];

    const mockNHLResponse = [
      {
        GameID: 23510,
        Season: 2025,
        SeasonType: 1,
        Status: 'InProgress',
        DateTime: '2025-03-16T13:00:00',
        AwayTeam: 'VEG',
        HomeTeam: 'DET',
        StadiumID: 11,
        Channel: 'TNT',
        AwayTeamScore: 0,
        HomeTeamScore: 3,
        Period: '2',
        TimeRemainingMinutes: 1,
        TimeRemainingSeconds: 24,
        LastPlay: 'End of 2nd Period',
        Updated: '2025-03-16T14:53:02',
        IsClosed: false,
        DateTimeUTC: '2025-03-16T17:00:00',
        GlobalGameID: 30023510,
        NeutralVenue: false,
        SeriesInfo: null,
        Periods: [],
      },
    ];

    const mockNBAResponse = [
      {
        GameID: 21937,
        Season: 2025,
        SeasonType: 1,
        Status: 'InProgress',
        DateTime: '2025-03-16T13:00:00',
        AwayTeam: 'PHI',
        HomeTeam: 'DAL',
        StadiumID: 25,
        Channel: 'NBCS',
        AwayTeamScore: 104,
        HomeTeamScore: 91,
        Quarter: '4',
        TimeRemainingMinutes: 7,
        TimeRemainingSeconds: 8,
        LastPlay: 'Scrambled',
        Updated: '2025-03-16T15:02:46',
        IsClosed: false,
        DateTimeUTC: '2025-03-16T17:00:00',
        GlobalGameID: 20021937,
        NeutralVenue: false,
        SeriesInfo: null,
        Quarters: [],
      },
    ];

    it('should return MLB games', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of({
          data: mockMLBResponse,
        }),
      );

      const result = await service.getGames('mlb');
      expect(result[0]).toMatchObject({
        GameID: 74183,
        DateTime: '2025-03-16T13:05:00',
        Status: 'Mid 6',
        AwayTeam: 'PHI',
        HomeTeam: 'BAL',
        AwayTeamScore: 2,
        HomeTeamScore: 0,
        Channel: 'ESPN',
        StadiumDetails: 'Inning: Mid 6',
      });
    });

    it('should return NFL games', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of({
          data: mockNFLResponse,
        }),
      );

      const result = await service.getGames('nfl');
      expect(result[0]).toMatchObject({
        HomeTeam: 'Raiders',
        HomeTeamScore: 17,
        AwayTeam: 'Chiefs',
        AwayTeamScore: 24,
        Status: 'Final',
      });
      expect(result[0].GameID).toBeDefined();
      expect(result[0].DateTime).toBeDefined();
    });

    it('should return NHL games', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of({
          data: mockNHLResponse,
        }),
      );

      const result = await service.getGames('nhl');
      expect(result[0]).toMatchObject({
        GameID: 23510,
        DateTime: '2025-03-16T13:00:00',
        Status: 'Period 2 - 1:24',
        AwayTeam: 'VEG',
        HomeTeam: 'DET',
        AwayTeamScore: 0,
        HomeTeamScore: 3,
        Channel: 'TNT',
        StadiumDetails: 'End of 2nd Period',
      });
    });

    it('should return NBA games', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of({
          data: mockNBAResponse,
        }),
      );

      const result = await service.getGames('nba');
      expect(result[0]).toMatchObject({
        GameID: 21937,
        DateTime: '2025-03-16T13:00:00',
        Status: 'Q4 - 7:08',
        AwayTeam: 'PHI',
        HomeTeam: 'DAL',
        AwayTeamScore: 104,
        HomeTeamScore: 91,
        Channel: 'NBCS',
        StadiumDetails: 'Scrambled',
      });
    });

    it('should handle API errors', async () => {
      mockHttpService.get.mockReturnValueOnce(
        throwError(() => ({
          response: {
            status: 500,
            data: { message: 'API Error' },
          },
        })),
      );

      await expect(service.getGames('mlb')).rejects.toThrow(HttpException);
    });

    it('should handle empty response', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of({
          data: [],
        }),
      );

      const result = await service.getGames('mlb');
      expect(result).toEqual([]);
    });

    it('should throw error for invalid sport type', async () => {
      await expect(service.getGames('invalid' as SportType)).rejects.toThrow(
        'Invalid sport type',
      );
    });
  });
});
