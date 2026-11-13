export interface UserProgress {
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  gamesPlayed: number;
  exerciseStats: {
    logic: ExerciseStats;
    memory: ExerciseStats;
    math: ExerciseStats;
    words: ExerciseStats;
  };
  dailyProgress: DailyProgress[];
  trainingDays?: number;
}

export interface ExerciseStats {
  played: number;
  bestScore: number;
  totalPoints: number;
}

export interface DailyProgress {
  date: string;
  points: number;
  exercisesCompleted: string[];
}

export type ExerciseType = 'logic' | 'memory' | 'math' | 'words';

export interface GameResult {
  type: ExerciseType;
  score: number;
  maxScore: number;
  timeSpent: number;
}
