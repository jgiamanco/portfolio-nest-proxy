export type SportType = 'mlb' | 'nfl' | 'nhl' | 'nba';

export interface GameData {
  GameID: number;
  DateTime: string;
  Status: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayTeamScore: number;
  HomeTeamScore: number;
  Channel?: string;
  StadiumDetails?: string;
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
  Channel?: string;
  StadiumDetails?: string;
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
