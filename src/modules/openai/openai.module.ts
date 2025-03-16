import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OpenAIController } from './openai.controller';
import { OpenAIService } from './openai.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [OpenAIController],
  providers: [OpenAIService],
})
export class OpenAIModule {}
