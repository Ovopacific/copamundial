export type MatchStatus = 'pending' | 'live' | 'finished';

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string; // URL or emoji
  awayFlag: string; // URL or emoji
  date: Date;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
}

export interface Prediction {
  id?: string;
  userId: string;
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  locked: boolean;
}
