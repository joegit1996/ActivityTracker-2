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

export interface ProgressResponse {
  campaign: Campaign;
  progress: Progress;
  streak: Streak;
  tasks: Task[];
  previousDays: PreviousDay[];
  nextDay: number | null;
}
