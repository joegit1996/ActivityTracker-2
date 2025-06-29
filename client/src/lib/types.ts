export interface Campaign {
  id: number;
  title: string;
  description: string;
  totalDays: number;
  reward: {
    title: string;
    description: string;
  };
}

export interface Progress {
  currentDay: number;
  completedDays: number;
  percentage: number;
}

export interface Streak {
  currentDays: number;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  number: number;
}

export interface PreviousDay {
  number: number;
  completedAt: string;
}

export interface LocalizedMiniReward {
  id: number;
  campaign_id: number;
  title: string;
  description: string;
  after_day_number: number;
}

export interface ProgressResponse {
  campaign: Campaign;
  progress: Progress;
  streak: Streak;
  tasks: Task[];
  previousDays: PreviousDay[];
  nextDay: number | null;
  miniRewards: LocalizedMiniReward[];
}

export interface MiniReward {
  id: number;
  campaign_id: number;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  after_day_number: number;
}

export type InsertMiniReward = Omit<MiniReward, 'id'>;
