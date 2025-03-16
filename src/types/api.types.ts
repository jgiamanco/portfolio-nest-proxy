// Common API response types
export interface ErrorResponse {
  error?: string;
  message?: string;
  statusCode?: number;
  data?: {
    message?: string;
    error?: string;
  };
}

// Weather API Types
export interface WeatherResponse {
  coord: {
    lat: number;
    lon: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  name: string;
  sys: {
    country: string;
  };
  timezone: number;
}

// Stock API Types
export interface StockQuoteResponse {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
}

export interface StockHistoricalResponse {
  c: number[]; // Array of close prices
  h: number[]; // Array of high prices
  l: number[]; // Array of low prices
  o: number[]; // Array of open prices
  s: string; // Status of response
  t: number[]; // Array of timestamps
  v: number[]; // Array of volume data
}

// Discord API Types
export interface DiscordWidgetResponse {
  id: string;
  name: string;
  instant_invite: string;
  presence_count: number;
  members: Array<{
    id: string;
    username: string;
    status: string;
    avatar_url: string;
  }>;
}

// OpenAI API Types
export interface AssistantMessage {
  role: 'assistant' | 'user';
  content: Array<{
    type: 'text';
    text: {
      value: string;
    };
  }>;
}

export interface ThreadResponse {
  id: string;
}

export interface RunResponse {
  id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
}

export interface MessagesResponse {
  data: AssistantMessage[];
}

// Weather API types
export interface OpenWeatherResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  name: string;
  sys: {
    country: string;
  };
  wind: {
    speed: number;
  };
  timezone: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  feelsLike: number;
  humidity: number;
  description: string;
  windSpeed: number;
  timezone: number;
}

// Stock API types
export interface FinnhubQuoteResponse {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
}

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  timestamp: number;
}

export interface StockHistoryData {
  day: Array<{ date: string; price: number }>;
  week: Array<{ date: string; price: number }>;
  month: Array<{ date: string; price: number }>;
  symbol?: string;
  timestamp?: number;
}

// Sports API Types
export interface SportsGameResponse {
  GameID?: number;
  GameId?: number;
  gameId?: number;
  Status?: string;
  status?: string;
  DateTime?: string;
  GameDate?: string;
  Date?: string;
  dateTime?: string;
  AwayTeam?: string;
  VenueTeam?: string;
  VisitorTeam?: string;
  HomeTeam?: string;
  LocalTeam?: string;
  AwayTeamRuns?: number;
  AwayTeamScore?: number;
  AwayScore?: number;
  VenueTeamScore?: number;
  HomeTeamRuns?: number;
  HomeTeamScore?: number;
  HomeScore?: number;
  LocalTeamScore?: number;
  Quarter?: string;
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
