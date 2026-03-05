export type Rating = 'S' | 'A' | 'B' | 'C' | 'F';

export interface DiscardContext {
  roundNum: number;
  handBefore: string[];
  discardedTile: string;
  handAfter: string[];
  opponentDiscards: string[];
  elapsedMs: number;
  kaWuXingPotentialBefore: boolean;
  kaWuXingPotentialAfter: boolean;
  // Additional context for better analysis
  gamePhase: string;
  isLiangDao: boolean;
}

export interface CoachFeedback {
  rating: Rating;
  summary: string;
  analysis: string;
}
