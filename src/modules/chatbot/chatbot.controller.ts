import {
  Controller,
  Post,
  Body,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

export interface ChatMessageDto {
  message: string;
}

export interface ChatResponseDto {
  response: string;
}

@Controller('api/chatbot')
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  async handleMessage(@Body() body: ChatMessageDto): Promise<ChatResponseDto> {
    this.logger.debug('Received chat message', { message: body.message });
    const response = await this.chatbotService.handleMessage(body.message);
    return { response };
  }
}
