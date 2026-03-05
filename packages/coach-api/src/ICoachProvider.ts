import { DiscardContext, CoachFeedback } from './types';

export interface ICoachProvider {
  name: string;
  description: string;
  analyze: (context: DiscardContext) => Promise<CoachFeedback>;
  warmup?: () => Promise<boolean>;
}
