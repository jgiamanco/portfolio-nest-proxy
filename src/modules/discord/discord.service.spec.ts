import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { DiscordService } from './discord.service';
import { of, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';

describe('DiscordService', () => {
  let service: DiscordService;

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<DiscordService>(DiscordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getServerWidget', () => {
    const mockWidgetResponse = {
      id: '123456789',
      name: 'Test Server',
      instant_invite: 'https://discord.gg/test',
      presence_count: 10,
      members: [
        {
          id: '987654321',
          username: 'TestUser',
          status: 'online',
          avatar_url: 'https://cdn.discordapp.com/avatars/test.png',
        },
      ],
    };

    it('should return server widget data', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of({
          data: mockWidgetResponse,
        }),
      );

      const result = await service.getServerWidget('123456789');

      expect(result).toEqual(mockWidgetResponse);
    });

    it('should handle 404 error when widget is not enabled', async () => {
      mockHttpService.get.mockReturnValueOnce(
        throwError(() => ({
          response: {
            status: 404,
            data: { message: 'Widget not enabled' },
          },
        })),
      );

      await expect(service.getServerWidget('123456789')).rejects.toThrow(
        'Discord widget is not enabled for this server. Please enable it in server settings.',
      );
    });

    it('should handle other API errors', async () => {
      mockHttpService.get.mockReturnValueOnce(
        throwError(() => ({
          response: {
            status: 500,
            data: { message: 'Internal server error' },
          },
        })),
      );

      await expect(service.getServerWidget('123456789')).rejects.toThrow(
        HttpException,
      );
    });
  });
});
