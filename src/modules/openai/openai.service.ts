import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import {
  AssistantMessage,
  ThreadResponse,
  RunResponse,
  MessagesResponse,
  ErrorResponse,
} from '../../types/api.types';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly apiKey: string;
  private readonly assistantId = 'asst_H6bV1Mn6VCb2OuplombtzW58';
  private readonly baseUrl = 'https://api.openai.com/v1';
  private readonly timeout = 30000; // 30 seconds timeout
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000; // 2 seconds
  private readonly initialPollingInterval = 200; // 200ms initial polling interval
  private readonly maxPollingInterval = 2000; // 2s maximum polling interval
  private readonly maxPollingTime = 45000; // 45 seconds maximum polling time

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in environment variables');
    }
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'OpenAI-Beta': 'assistants=v2',
    };
  }

  private getErrorMessage(error: AxiosError<ErrorResponse>): string {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.data?.message ||
      error.response?.data?.data?.error ||
      'Failed to process OpenAI request'
    );
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: Error;
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        this.logger.debug(
          `Attempting ${operationName} (attempt ${i + 1}/${this.maxRetries})`,
        );
        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `${operationName} attempt ${i + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        if (i < this.maxRetries - 1) {
          const delay = this.retryDelay * (i + 1);
          this.logger.debug(`Waiting ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError!;
  }

  private getRequestConfig() {
    return {
      headers: this.getHeaders(),
      timeout: this.timeout,
    };
  }

  private calculatePollingInterval(elapsedTime: number): number {
    // Start with fast polling (200ms) and gradually increase to 2s
    const interval = Math.min(
      this.initialPollingInterval * Math.pow(1.5, elapsedTime / 5000),
      this.maxPollingInterval,
    );
    return Math.round(interval);
  }

  async createThread(): Promise<ThreadResponse> {
    const url = `${this.baseUrl}/threads`;

    try {
      const { data } = await firstValueFrom(
        this.httpService
          .post<ThreadResponse>(
            url,
            { metadata: {} },
            { headers: this.getHeaders() },
          )
          .pipe(
            map((response) => response),
            catchError((error: AxiosError<ErrorResponse>) => {
              throw new HttpException(
                error.response?.data?.message || 'Failed to create thread',
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
        'Failed to create thread',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addMessage(
    threadId: string,
    message: string,
  ): Promise<AssistantMessage> {
    const url = `${this.baseUrl}/threads/${threadId}/messages`;

    try {
      const { data } = await firstValueFrom(
        this.httpService
          .post<AssistantMessage>(
            url,
            { role: 'user', content: message },
            { headers: this.getHeaders() },
          )
          .pipe(
            map((response) => response),
            catchError((error: AxiosError<ErrorResponse>) => {
              throw new HttpException(
                error.response?.data?.message || 'Failed to add message',
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
        'Failed to add message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createRun(threadId: string): Promise<RunResponse> {
    const url = `${this.baseUrl}/threads/${threadId}/runs`;

    try {
      const { data } = await firstValueFrom(
        this.httpService
          .post<RunResponse>(
            url,
            {
              assistant_id: this.assistantId,
              model: 'gpt-4o-mini', // Using faster model
            },
            { headers: this.getHeaders() },
          )
          .pipe(
            map((response) => response),
            catchError((error: AxiosError<ErrorResponse>) => {
              throw new HttpException(
                error.response?.data?.message || 'Failed to create run',
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
        'Failed to create run',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRunStatus(threadId: string, runId: string): Promise<RunResponse> {
    const url = `${this.baseUrl}/threads/${threadId}/runs/${runId}`;

    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get<RunResponse>(url, { headers: this.getHeaders() })
          .pipe(
            map((response) => response),
            catchError((error: AxiosError<ErrorResponse>) => {
              throw new HttpException(
                error.response?.data?.message || 'Failed to get run status',
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
        'Failed to get run status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMessages(threadId: string): Promise<AssistantMessage[]> {
    const url = `${this.baseUrl}/threads/${threadId}/messages`;

    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get<MessagesResponse>(url, { headers: this.getHeaders() })
          .pipe(
            map((response) => response.data),
            catchError((error: AxiosError<ErrorResponse>) => {
              throw new HttpException(
                error.response?.data?.message || 'Failed to get messages',
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
        'Failed to get messages',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendMessage(message: string): Promise<string> {
    this.logger.log('Starting to process message');
    let threadId: string | undefined;

    try {
      // Create a thread with retry
      this.logger.log('Creating thread...');
      const threadResponse = await this.retryOperation(
        () =>
          firstValueFrom(
            this.httpService
              .post<ThreadResponse>(
                `${this.baseUrl}/threads`,
                { metadata: {} },
                this.getRequestConfig(),
              )
              .pipe(
                map((response) => response.data),
                catchError((error: AxiosError<ErrorResponse>) => {
                  this.logger.error(
                    'Failed to create thread:',
                    this.getErrorMessage(error),
                  );
                  throw new HttpException(
                    this.getErrorMessage(error),
                    error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                  );
                }),
              ),
          ),
        'create thread',
      );

      threadId = threadResponse.id;
      this.logger.debug(`Created thread with ID: ${threadId}`);

      // Add message to thread with retry
      this.logger.log('Adding message to thread...');
      await this.retryOperation(
        () =>
          firstValueFrom(
            this.httpService
              .post(
                `${this.baseUrl}/threads/${threadId}/messages`,
                { role: 'user', content: message },
                this.getRequestConfig(),
              )
              .pipe(
                catchError((error: AxiosError<ErrorResponse>) => {
                  this.logger.error(
                    'Failed to add message:',
                    this.getErrorMessage(error),
                  );
                  throw new HttpException(
                    this.getErrorMessage(error),
                    error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                  );
                }),
              ),
          ),
        'add message',
      );

      // Create a run with retry
      this.logger.log('Creating run...');
      const runResponse = await this.retryOperation(
        () =>
          firstValueFrom(
            this.httpService
              .post<RunResponse>(
                `${this.baseUrl}/threads/${threadId}/runs`,
                {
                  assistant_id: this.assistantId,
                  model: 'gpt-3.5-turbo', // Using faster model
                },
                this.getRequestConfig(),
              )
              .pipe(
                map((response) => response.data),
                catchError((error: AxiosError<ErrorResponse>) => {
                  this.logger.error(
                    'Failed to create run:',
                    this.getErrorMessage(error),
                  );
                  throw new HttpException(
                    this.getErrorMessage(error),
                    error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                  );
                }),
              ),
          ),
        'create run',
      );

      // Poll for completion with timeout
      this.logger.log('Polling for completion...');
      let runStatus = runResponse.status;
      const startTime = Date.now();

      while (
        (runStatus === 'queued' || runStatus === 'in_progress') &&
        Date.now() - startTime < this.maxPollingTime
      ) {
        const elapsedTime = Date.now() - startTime;
        const pollingInterval = this.calculatePollingInterval(elapsedTime);

        this.logger.debug(`Waiting ${pollingInterval}ms before next poll...`);
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));

        const statusResponse = await this.retryOperation(
          () =>
            firstValueFrom(
              this.httpService
                .get<RunResponse>(
                  `${this.baseUrl}/threads/${threadId}/runs/${runResponse.id}`,
                  this.getRequestConfig(),
                )
                .pipe(
                  map((response) => response.data),
                  catchError((error: AxiosError<ErrorResponse>) => {
                    this.logger.error(
                      'Failed to get run status:',
                      this.getErrorMessage(error),
                    );
                    throw new HttpException(
                      this.getErrorMessage(error),
                      error.response?.status ||
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                  }),
                ),
            ),
          'get run status',
        );

        runStatus = statusResponse.status;
        this.logger.debug(`Run status: ${runStatus}`);
      }

      if (runStatus !== 'completed') {
        this.logger.error(
          `Run failed or timed out. Final status: ${runStatus}`,
        );
        throw new HttpException(
          'Request timed out or failed',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      // Get messages with retry
      this.logger.log('Getting messages...');
      const messagesResponse = await this.retryOperation(
        () =>
          firstValueFrom(
            this.httpService
              .get<MessagesResponse>(
                `${this.baseUrl}/threads/${threadId}/messages`,
                this.getRequestConfig(),
              )
              .pipe(
                map((response) => response.data),
                catchError((error: AxiosError<ErrorResponse>) => {
                  this.logger.error(
                    'Failed to get messages:',
                    this.getErrorMessage(error),
                  );
                  throw new HttpException(
                    this.getErrorMessage(error),
                    error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                  );
                }),
              ),
          ),
        'get messages',
      );

      const assistantMessage = messagesResponse.data.find(
        (msg) => msg.role === 'assistant',
      );

      if (!assistantMessage?.content[0]?.text?.value) {
        this.logger.error('No response from assistant');
        throw new Error('No response from assistant');
      }

      this.logger.log('Successfully processed message');
      return assistantMessage.content[0].text.value;
    } catch (error) {
      this.logger.error(
        'Error in sendMessage:',
        error instanceof Error ? error.message : 'Unknown error',
      );
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
