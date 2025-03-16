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
  GameID?: number;
  GameId?: number;
  gameId?: number;
  DateTime?: string;
  GameDate?: string;
  Date?: string;
  dateTime?: string;
  VenueTeam?: string;
  VisitorTeam?: string;
  LocalTeam?: string;
  AwayScore?: number;
  VenueTeamScore?: number;
  Period?: string;
  Inning?: string;
  TimeRemainingMinutes?: number;
  MinutesRemaining?: number;
  TimeRemainingSeconds?: number;
  SecondsRemaining?: number;
  Channel?: string;
  Broadcast?: string;
  StadiumDetails?: string;
  Venue?: string;
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
