import { Controller, Post, Body } from '@nestjs/common';
import { OpenAIService } from './openai.service';

@Controller('api/openai')
export class OpenAIController {
  constructor(private readonly openaiService: OpenAIService) {}

  @Post('chat')
  async sendMessage(
    @Body('message') message: string,
  ): Promise<{ response: string }> {
    const response = await this.openaiService.sendMessage(message);
    return { response };
  }
}
