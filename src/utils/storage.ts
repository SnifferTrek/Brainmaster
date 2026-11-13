import type { UserProgress, GameResult, ExerciseType } from '../types';

const STORAGE_KEY = 'gehirntraining_progress';

const defaultProgress: UserProgress = {
  totalPoints: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: null,
  gamesPlayed: 0,
  exerciseStats: {
    logic: { played: 0, bestScore: 0, totalPoints: 0 },
    memory: { played: 0, bestScore: 0, totalPoints: 0 },
    math: { played: 0, bestScore: 0, totalPoints: 0 },
    words: { played: 0, bestScore: 0, totalPoints: 0 },
  },
  dailyProgress: [],
};

export function getProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultProgress, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading progress:', e);
  }
  return { ...defaultProgress };
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Error saving progress:', e);
  }
}

export function calculateLevel(points: number): number {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (points >= thresholds[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getPointsForNextLevel(level: number): number {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600];
  return thresholds[level] || thresholds[thresholds.length - 1];
}

export function getPointsForCurrentLevel(level: number): number {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
  return thresholds[level - 1] || 0;
}

export function updateProgressWithResult(result: GameResult): UserProgress {
  const progress = getProgress();
  const today = new Date().toISOString().split('T')[0];
  
  // Update streak
  if (progress.lastPlayedDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (progress.lastPlayedDate === yesterdayStr) {
      progress.currentStreak += 1;
    } else if (progress.lastPlayedDate !== today) {
      progress.currentStreak = 1;
    }
    
    if (progress.currentStreak > progress.longestStreak) {
      progress.longestStreak = progress.currentStreak;
    }
  }
  
  progress.lastPlayedDate = today;
  progress.gamesPlayed += 1;
  progress.totalPoints += result.score;
  progress.level = calculateLevel(progress.totalPoints);
  
  // Update exercise stats
  const stats = progress.exerciseStats[result.type];
  stats.played += 1;
  stats.totalPoints += result.score;
  stats.totalMaxScore = (stats.totalMaxScore || 0) + result.maxScore;
  if (result.score > stats.bestScore) {
    stats.bestScore = result.score;
  }
  
  // Update daily progress
  let todayProgress = progress.dailyProgress.find(d => d.date === today);
  if (!todayProgress) {
    todayProgress = { date: today, points: 0, exercisesCompleted: [] };
    progress.dailyProgress.push(todayProgress);
  }
  todayProgress.points += result.score;
  if (!todayProgress.exercisesCompleted.includes(result.type)) {
    todayProgress.exercisesCompleted.push(result.type);
  }
  
  // Keep only last 30 days
  progress.dailyProgress = progress.dailyProgress
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);
  
  saveProgress(progress);
  return progress;
}

export function getTodayProgress(): { points: number; exercisesCompleted: ExerciseType[] } {
  const progress = getProgress();
  const today = new Date().toISOString().split('T')[0];
  const todayProgress = progress.dailyProgress.find(d => d.date === today);
  return {
    points: todayProgress?.points || 0,
    exercisesCompleted: (todayProgress?.exercisesCompleted || []) as ExerciseType[],
  };
}
