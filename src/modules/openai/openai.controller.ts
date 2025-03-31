import { Controller, Post, Body, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';

@Controller('api/openai')
export class OpenAIController {
  private readonly logger = new Logger(OpenAIController.name);

  constructor(private readonly openaiService: OpenAIService) {}

  @Post('chat')
  async sendMessage(
    @Body('message') message: string,
  ): Promise<{ response: string }> {
    try {
      this.logger.log(`Received message: ${message}`);
      const response = await this.openaiService.sendMessage(message);
      this.logger.log(`Successfully processed message`);
      return { response };
    } catch (error) {
      this.logger.error(
        `Error processing message: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
