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
        HomeTeam: 'Red Sox',
        HomeTeamScore: 3,
        AwayTeam: 'Yankees',
        AwayTeamScore: 5,
        Status: 'Final',
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
        HomeTeam: 'Rangers',
        HomeTeamScore: 2,
        AwayTeam: 'Bruins',
        AwayTeamScore: 4,
        Status: 'Final',
      },
    ];

    const mockNBAResponse = [
      {
        competitions: [
          {
            competitors: [
              { team: { name: 'Lakers' }, score: '120' },
              { team: { name: 'Warriors' }, score: '115' },
            ],
            status: { type: { completed: true } },
          },
        ],
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
        HomeTeam: 'Red Sox',
        HomeTeamScore: 3,
        AwayTeam: 'Yankees',
        AwayTeamScore: 5,
        Status: 'Final',
      });
      expect(result[0].GameID).toBeDefined();
      expect(result[0].DateTime).toBeDefined();
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
        HomeTeam: 'Rangers',
        HomeTeamScore: 2,
        AwayTeam: 'Bruins',
        AwayTeamScore: 4,
        Status: 'Final',
      });
      expect(result[0].GameID).toBeDefined();
      expect(result[0].DateTime).toBeDefined();
    });

    it('should return NBA games', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of({
          data: mockNBAResponse,
        }),
      );

      const result = await service.getGames('nba');
      expect(result[0]).toMatchObject({
        HomeTeam: 'Warriors',
        HomeTeamScore: 115,
        AwayTeam: 'Lakers',
        AwayTeamScore: 120,
        Status: 'Final',
      });
      expect(result[0].GameID).toBeDefined();
      expect(result[0].DateTime).toBeDefined();
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
