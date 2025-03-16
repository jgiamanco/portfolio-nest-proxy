import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';

@Module({
  imports: [HttpModule],
  controllers: [DiscordController],
  providers: [DiscordService],
})
export class DiscordModule {}
