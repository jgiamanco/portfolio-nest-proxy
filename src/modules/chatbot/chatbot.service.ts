import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';

interface ThreadResponse {
  id: string;
  object: string;
  created_at: number;
}

interface MessageContent {
  type: 'text';
  text: {
    value: string;
    annotations: any[];
  };
}

interface Message {
  id: string;
  object: string;
  created_at: number;
  thread_id: string;
  role: 'assistant' | 'user';
  content: MessageContent[];
}

interface MessagesResponse {
  object: string;
  data: Message[];
  first_id: string;
  last_id: string;
  has_more: boolean;
}

interface RunResponse {
  id: string;
  object: string;
  created_at: number;
  thread_id: string;
  assistant_id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
}

interface OpenAIErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
  message?: string;
}

interface AssistantResponse {
  id: string;
  object: string;
  created_at: number;
  name: string;
  model: string;
}

@Injectable()
export class ChatbotService implements OnModuleInit {
  private readonly apiKey: string;
  private readonly assistantId: string;
  private readonly baseUrl = 'https://api.openai.com/v1';
  private readonly model = 'gpt-4o';
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const assistantId = this.configService.get<string>('OPENAI_ASSISTANT_ID');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined');
    }
    if (!assistantId) {
      throw new Error('OPENAI_ASSISTANT_ID is not defined');
    }

    this.apiKey = apiKey;
    this.assistantId = assistantId;
    this.logger.log('ChatbotService initialized');
    this.logger.debug(`Using model: ${this.model}`);
  }

  async onModuleInit() {
    try {
      // First, try to list all assistants
      this.logger.debug('Listing all assistants');
      const listResponse = await firstValueFrom(
        this.httpService
          .get<{ data: AssistantResponse[] }>(`${this.baseUrl}/assistants`, {
            headers: this.getHeaders(),
          })
          .pipe(
            catchError((error: AxiosError<OpenAIErrorResponse>) => {
              const errorData = error.response?.data;
              this.logger.error('Failed to list assistants:', {
                error: errorData,
                status: error.response?.status,
                statusText: error.response?.statusText,
              });
              throw new Error(
                errorData?.error?.message || 'Failed to list assistants',
              );
            }),
          ),
      );

      this.logger.debug('Available assistants:', {
        count: listResponse.data.data.length,
        assistants: listResponse.data.data.map((a) => ({
          id: a.id,
          name: a.name,
        })),
      });

      // Then validate the specific assistant
      const assistantUrl = `${this.baseUrl}/assistants/${this.assistantId}`;
      this.logger.debug('Validating specific assistant', {
        url: assistantUrl,
        assistantId: this.assistantId,
        headers: {
          ...this.getHeaders(),
          Authorization: `Bearer sk-...${this.apiKey.slice(-4)}`,
        },
      });

      const response = await firstValueFrom(
        this.httpService
          .get<AssistantResponse>(assistantUrl, {
            headers: this.getHeaders(),
          })
          .pipe(
            catchError((error: AxiosError<OpenAIErrorResponse>) => {
              const errorData = error.response?.data;
              this.logger.error('Assistant validation failed:', {
                error: errorData,
                status: error.response?.status,
                statusText: error.response?.statusText,
                assistantId: this.assistantId,
                url: assistantUrl,
                headers: {
                  ...this.getHeaders(),
                  Authorization: 'Bearer sk-....' + this.apiKey.slice(-4),
                },
              });
              throw new Error(
                errorData?.error?.message || 'Failed to validate assistant',
              );
            }),
          ),
      );

      const assistant = response.data;
      this.logger.log('Assistant validated successfully:', {
        id: assistant.id,
        name: assistant.name,
        model: assistant.model,
        url: assistantUrl,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          'Failed to initialize ChatbotService:',
          error.message,
        );
        throw error;
      }
      this.logger.error('Failed to initialize ChatbotService:', error);
      throw new Error('Failed to initialize ChatbotService');
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'OpenAI-Beta': 'assistants=v2',
      'User-Agent': 'Portfolio-Assistant/1.0',
    };
  }

  async handleMessage(message: string): Promise<string> {
    try {
      // Create a thread
      this.logger.debug('Creating thread');
      const threadResponse = await firstValueFrom(
        this.httpService
          .post<ThreadResponse>(
            `${this.baseUrl}/threads`,
            { metadata: {} },
            { headers: this.getHeaders() },
          )
          .pipe(
            map((response) => response.data),
            catchError((error: AxiosError) => {
              this.logger.error('Failed to create thread:', {
                error: error.response?.data,
                status: error.response?.status,
              });
              throw new HttpException(
                'Failed to create thread',
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );
      this.logger.debug('Thread created successfully', {
        threadId: threadResponse.id,
      });

      // Add message to thread
      this.logger.debug('Adding message to thread', {
        threadId: threadResponse.id,
      });
      await firstValueFrom(
        this.httpService
          .post<Message>(
            `${this.baseUrl}/threads/${threadResponse.id}/messages`,
            { role: 'user', content: message },
            { headers: this.getHeaders() },
          )
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error('Failed to add message:', {
                error: error.response?.data,
                status: error.response?.status,
                threadId: threadResponse.id,
              });
              throw new HttpException(
                'Failed to add message',
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );
      this.logger.debug('Message added successfully');

      // Create a run
      this.logger.debug('Creating run', {
        threadId: threadResponse.id,
        assistantId: this.assistantId,
      });

      const runResponse = await firstValueFrom(
        this.httpService
          .post<RunResponse>(
            `${this.baseUrl}/threads/${threadResponse.id}/runs`,
            {
              assistant_id: this.assistantId,
              instructions: `You are a helpful AI assistant that provides information about Jacob's skills, experience, and projects. Format your responses in a clear, visually appealing way using markdown.`,
            },
            { headers: this.getHeaders() },
          )
          .pipe(
            map((response) => response.data),
            catchError((error: AxiosError<OpenAIErrorResponse>) => {
              const errorData = error.response?.data;
              this.logger.error('Failed to create run:', {
                error: errorData,
                status: error.response?.status,
                threadId: threadResponse.id,
                assistantId: this.assistantId,
                message: errorData?.error?.message || errorData?.message,
              });
              throw new HttpException(
                errorData?.error?.message ||
                  errorData?.message ||
                  'Failed to create run',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );
      this.logger.debug('Run created successfully', {
        runId: runResponse.id,
        status: runResponse.status,
      });

      // Poll for completion
      let runStatus = runResponse.status;
      let attempts = 0;
      const maxAttempts = 30;

      while (
        (runStatus === 'queued' || runStatus === 'in_progress') &&
        attempts < maxAttempts
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;

        const statusResponse = await firstValueFrom(
          this.httpService
            .get<RunResponse>(
              `${this.baseUrl}/threads/${threadResponse.id}/runs/${runResponse.id}`,
              { headers: this.getHeaders() },
            )
            .pipe(
              map((response) => response.data),
              catchError((error: AxiosError) => {
                this.logger.error(
                  'Failed to get run status:',
                  error.response?.data,
                );
                throw new HttpException(
                  'Failed to get run status',
                  HttpStatus.INTERNAL_SERVER_ERROR,
                );
              }),
            ),
        );

        runStatus = statusResponse.status;
      }

      if (runStatus !== 'completed') {
        throw new HttpException(
          'Request timed out or failed',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      // Get messages
      const messagesResponse = await firstValueFrom(
        this.httpService
          .get<MessagesResponse>(
            `${this.baseUrl}/threads/${threadResponse.id}/messages`,
            { headers: this.getHeaders() },
          )
          .pipe(
            map((response) => response.data),
            catchError((error: AxiosError) => {
              this.logger.error(
                'Failed to get messages:',
                error.response?.data,
              );
              throw new HttpException(
                'Failed to get messages',
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      const assistantMessage = messagesResponse.data.find(
        (msg) => msg.role === 'assistant',
      );

      if (!assistantMessage?.content[0]?.text?.value) {
        throw new Error('No response from assistant');
      }

      return assistantMessage.content[0].text.value.replace(/【[^】]*】/g, '');
    } catch (error) {
      this.logger.error('Error processing message:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to process message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
