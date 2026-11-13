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
  difficulty: DifficultySettings;
}

export interface DifficultySettings {
  logic: DifficultyInfo;
  memory: DifficultyInfo;
  math: DifficultyInfo;
  words: DifficultyInfo;
}

export interface DifficultyInfo {
  level: number; // 1-10
  sessionCorrect: number;
  sessionTotal: number;
}

export interface ExerciseStats {
  played: number;
  bestScore: number;
  totalPoints: number;
  totalMaxScore?: number;
}

export interface DailyProgress {
  date: string;
  points: number;
  exercisesCompleted: string[];
  exerciseResults?: {
    [key in ExerciseType]?: {
      correct: number;
      total: number;
      difficultyLevel: number;
    };
  };
}

export type ExerciseType = 'logic' | 'memory' | 'math' | 'words';

export interface GameResult {
  type: ExerciseType;
  score: number;
  maxScore: number;
  timeSpent: number;
  correctAnswers: number;
  totalQuestions: number;
}

export type AchievementId = 
  | 'erste-schritte' | 'aufsteiger' | 'profi' | 'meister'
  | 'bestaendig' | 'ausdauernd' | 'unaufhaltsam'
  | 'logik-talent' | 'mathe-genie' | 'gedaechtnis-kuenstler' | 'wort-akrobat' | 'meister-des-geistes';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  emoji: string;
  category: 'points' | 'streak' | 'level';
  unlockedAt: string | null;
}

export interface AchievementData {
  achievements: { [key in AchievementId]?: string };
}
