import { Controller, Get, Param } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { DiscordWidgetResponse } from '../../types/api.types';

@Controller('api/discord')
export class DiscordController {
  constructor(private readonly discordService: DiscordService) {}

  @Get(':serverId')
  async getServerWidget(
    @Param('serverId') serverId: string,
  ): Promise<DiscordWidgetResponse> {
    return this.discordService.getServerWidget(serverId);
  }
}
