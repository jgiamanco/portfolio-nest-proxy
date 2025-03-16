export type SportType = 'mlb' | 'nfl' | 'nhl' | 'nba';

export interface GameData {
  homeTeam: string;
  homeScore: number;
  awayTeam: string;
  awayScore: number;
  status: string;
}

export interface BaseGameData {
  HomeTeam?: string;
  HomeTeamScore?: number;
  HomeTeamRuns?: number;
  AwayTeam?: string;
  AwayTeamScore?: number;
  AwayTeamRuns?: number;
  Status?: string;
  teams?: {
    home?: {
      team?: {
        name?: string;
      };
      score?: number;
    };
    away?: {
      team?: {
        name?: string;
      };
      score?: number;
    };
  };
  status?: {
    abstractGameState?: string;
  };
}

export interface LeagueGameData {
  competitions?: Array<{
    competitors?: Array<{
      team?: {
        name?: string;
      };
      score?: string;
    }>;
    status?: {
      type?: {
        completed?: boolean;
      };
    };
  }>;
}

export type RawGameData = BaseGameData | LeagueGameData;
