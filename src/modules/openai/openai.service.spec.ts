import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { of, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';

describe('OpenAIService', () => {
  let service: OpenAIService;

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-api-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
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

    service = module.get<OpenAIService>(OpenAIService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    const mockThreadResponse = {
      id: 'thread_123',
      object: 'thread',
      created_at: 1234567890,
    };

    const mockRunResponse = {
      id: 'run_123',
      object: 'thread.run',
      thread_id: 'thread_123',
      status: 'queued',
    };

    const mockRunCompletedResponse = {
      id: 'run_123',
      object: 'thread.run',
      thread_id: 'thread_123',
      status: 'completed',
    };

    const mockMessagesResponse = {
      data: [
        {
          id: 'msg_456',
          object: 'thread.message',
          thread_id: 'thread_123',
          content: [{ text: { value: 'Assistant response' } }],
          role: 'assistant',
        },
      ],
    };

    it('should process chat message and return response', async () => {
      // Mock thread creation
      mockHttpService.post.mockImplementationOnce(() =>
        of({ data: mockThreadResponse }),
      );

      // Mock message addition
      mockHttpService.post.mockImplementationOnce(() => of({ data: {} }));

      // Mock run creation
      mockHttpService.post.mockImplementationOnce(() =>
        of({ data: mockRunResponse }),
      );

      // Mock run status check (completed)
      mockHttpService.get.mockImplementationOnce(() =>
        of({ data: mockRunCompletedResponse }),
      );

      // Mock messages retrieval
      mockHttpService.get.mockImplementationOnce(() =>
        of({ data: mockMessagesResponse }),
      );

      const result = await service.sendMessage('Test message');
      expect(result).toBe('Assistant response');
    });

    it('should handle API errors', async () => {
      mockHttpService.post.mockImplementationOnce(() =>
        throwError(() => ({
          response: {
            status: 500,
            data: { message: 'API Error' },
          },
        })),
      );

      await expect(service.sendMessage('Test message')).rejects.toThrow(
        HttpException,
      );
    });

    it('should handle missing assistant response', async () => {
      // Mock thread creation
      mockHttpService.post.mockImplementationOnce(() =>
        of({ data: mockThreadResponse }),
      );

      // Mock message addition
      mockHttpService.post.mockImplementationOnce(() => of({ data: {} }));

      // Mock run creation
      mockHttpService.post.mockImplementationOnce(() =>
        of({ data: mockRunResponse }),
      );

      // Mock run status check (completed)
      mockHttpService.get.mockImplementationOnce(() =>
        of({ data: mockRunCompletedResponse }),
      );

      // Mock messages retrieval with no assistant message
      mockHttpService.get.mockImplementationOnce(() =>
        of({ data: { data: [] } }),
      );

      await expect(service.sendMessage('Test message')).rejects.toThrow(
        'Failed to process message',
      );
    });
  });
});
