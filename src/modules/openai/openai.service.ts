import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
  private readonly apiKey: string;
  private readonly assistantId = 'asst_H6bV1Mn6VCb2OuplombtzW58';
  private readonly baseUrl = 'https://api.openai.com/v1';

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
              model: 'gpt-4-turbo-preview',
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
    try {
      // Create a thread
      const threadResponse = await firstValueFrom(
        this.httpService
          .post<ThreadResponse>(
            `${this.baseUrl}/threads`,
            { metadata: {} },
            { headers: this.getHeaders() },
          )
          .pipe(
            map((response) => response.data),
            catchError((error: AxiosError<ErrorResponse>) => {
              throw new HttpException(
                this.getErrorMessage(error),
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      // Add message to thread
      await firstValueFrom(
        this.httpService
          .post(
            `${this.baseUrl}/threads/${threadResponse.id}/messages`,
            { role: 'user', content: message },
            { headers: this.getHeaders() },
          )
          .pipe(
            catchError((error: AxiosError<ErrorResponse>) => {
              throw new HttpException(
                this.getErrorMessage(error),
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      // Create a run
      const runResponse = await firstValueFrom(
        this.httpService
          .post<RunResponse>(
            `${this.baseUrl}/threads/${threadResponse.id}/runs`,
            {
              assistant_id: this.assistantId,
              model: 'gpt-4-turbo-preview',
            },
            { headers: this.getHeaders() },
          )
          .pipe(
            map((response) => response.data),
            catchError((error: AxiosError<ErrorResponse>) => {
              throw new HttpException(
                this.getErrorMessage(error),
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      // Poll for completion
      let runStatus = runResponse.status;
      while (runStatus === 'queued' || runStatus === 'in_progress') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const statusResponse = await firstValueFrom(
          this.httpService
            .get<RunResponse>(
              `${this.baseUrl}/threads/${threadResponse.id}/runs/${runResponse.id}`,
              { headers: this.getHeaders() },
            )
            .pipe(
              map((response) => response.data),
              catchError((error: AxiosError<ErrorResponse>) => {
                throw new HttpException(
                  this.getErrorMessage(error),
                  error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                );
              }),
            ),
        );
        runStatus = statusResponse.status;
      }

      if (runStatus !== 'completed') {
        throw new Error(`Run failed with status: ${runStatus}`);
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
            catchError((error: AxiosError<ErrorResponse>) => {
              throw new HttpException(
                this.getErrorMessage(error),
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
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

      return assistantMessage.content[0].text.value;
    } catch (error) {
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
