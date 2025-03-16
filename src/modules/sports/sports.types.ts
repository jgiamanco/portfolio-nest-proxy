export type SportType = 'mlb' | 'nfl' | 'nhl' | 'nba';

export interface GameData {
  GameID: number;
  DateTime: string;
  Status: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayTeamScore: number | null;
  HomeTeamScore: number | null;
  Channel: string | null;
  StadiumDetails?: string;
}

interface StadiumDetails {
  StadiumID: number;
  Name: string;
  City: string;
  State: string;
  Country: string;
  Capacity: number;
  PlayingSurface: string;
  GeoLat: number;
  GeoLong: number;
  Type: string;
}

interface BaseGameFields {
  GameID: number;
  Season: number;
  SeasonType: number;
  Status: string;
  DateTime: string;
  AwayTeam: string;
  HomeTeam: string;
  StadiumID: number;
  Channel: string | null;
  Updated: string;
  IsClosed: boolean;
  DateTimeUTC: string;
  GlobalGameID: number;
  NeutralVenue: boolean;
  SeriesInfo: null;
}

export interface MLBGameData extends BaseGameFields {
  AwayTeamRuns: number;
  HomeTeamRuns: number;
  Inning: number;
  InningHalf: string;
  InningDescription: string;
  LastPlay: string;
  Innings: any[];
}

export interface NHLGameData extends BaseGameFields {
  AwayTeamScore: number | null;
  HomeTeamScore: number | null;
  Period: string | null;
  TimeRemainingMinutes: number | null;
  TimeRemainingSeconds: number | null;
  LastPlay: string | null;
  Periods: any[];
}

export interface NBAGameData extends BaseGameFields {
  AwayTeamScore: number | null;
  HomeTeamScore: number | null;
  Quarter: string | null;
  TimeRemainingMinutes: number | null;
  TimeRemainingSeconds: number | null;
  LastPlay: string;
  Quarters: any[];
}

export interface NFLGameData {
  GameKey: string;
  SeasonType: number;
  Season: number;
  Week: number;
  Date: string;
  DateTime: string;
  Status: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayScore: number;
  HomeScore: number;
  Channel: string | null;
  Quarter: string;
  TimeRemaining: string | null;
  QuarterDescription: string;
  LastUpdated: string;
  LastPlay: string;
  GlobalGameID: number;
  StadiumID: number;
  NeutralVenue: boolean;
  IsClosed: boolean;
  StadiumDetails: StadiumDetails;
}

export type RawGameData = MLBGameData | NHLGameData | NBAGameData | NFLGameData;
