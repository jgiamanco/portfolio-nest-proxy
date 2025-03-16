import { Controller, Get, Param } from '@nestjs/common';
import { SportsService } from './sports.service';
import { SportsGameResponse } from '../../types/api.types';

type SportType = 'mlb' | 'nfl' | 'nhl' | 'nba';

@Controller('api/sports')
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Get(':sport')
  async getGames(
    @Param('sport') sport: SportType,
  ): Promise<SportsGameResponse[]> {
    return this.sportsService.getGames(sport);
  }
}
