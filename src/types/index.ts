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

export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
  points: number;
  exactScores: number;
  correctResults: number;
  createdAt: Date;
  lastConnection?: Date;
  inviteCodeUsed?: string;
  isAdmin?: boolean;
  role?: string;
}

export interface PredictionHistory {
  predictedHomeScore: number;
  predictedAwayScore: number;
  modifiedAt: Date;
}

export interface Prediction {
  id?: string;
  userId: string;
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  locked: boolean;
  modificationsCount?: number;
  createdAt?: Date;
  lastModifiedAt?: Date;
  history?: PredictionHistory[];
}
