import type { UserProgress, GameResult, ExerciseType, DifficultyInfo } from '../types';

const STORAGE_KEY = 'gehirntraining_progress';

const defaultDifficultyInfo: DifficultyInfo = {
  level: 1,
  sessionCorrect: 0,
  sessionTotal: 0,
};

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
  difficulty: {
    logic: { ...defaultDifficultyInfo },
    memory: { ...defaultDifficultyInfo },
    math: { ...defaultDifficultyInfo },
    words: { ...defaultDifficultyInfo },
  },
};

export function getProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const progress = { 
        ...defaultProgress, 
        ...parsed,
        difficulty: {
          logic: { ...defaultDifficultyInfo, ...parsed.difficulty?.logic },
          memory: { ...defaultDifficultyInfo, ...parsed.difficulty?.memory },
          math: { ...defaultDifficultyInfo, ...parsed.difficulty?.math },
          words: { ...defaultDifficultyInfo, ...parsed.difficulty?.words },
        }
      };
      return progress;
    }
  } catch (e) {
    console.error('Error loading progress:', e);
  }
  return { ...defaultProgress };
}

export function getDifficulty(type: ExerciseType): number {
  const progress = getProgress();
  return progress.difficulty[type].level;
}

export function getDifficultyLabel(level: number): string {
  const labels = [
    'Anfänger',      // 1
    'Einsteiger',    // 2
    'Fortgeschritten', // 3
    'Geübt',         // 4
    'Routiniert',    // 5
    'Erfahren',      // 6
    'Kompetent',     // 7
    'Fortgeschritten+', // 8
    'Profi',         // 9
    'Experte',       // 10
  ];
  return labels[Math.min(level - 1, 9)] || 'Anfänger';
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
  if (result.score > stats.bestScore) {
    stats.bestScore = result.score;
  }
  
  // Update difficulty tracking
  const diffInfo = progress.difficulty[result.type];
  diffInfo.sessionCorrect += result.correctAnswers;
  diffInfo.sessionTotal += result.totalQuestions;
  
  // Calculate success rate and adjust difficulty
  if (diffInfo.sessionTotal >= 5) {
    const successRate = diffInfo.sessionCorrect / diffInfo.sessionTotal;
    
    if (successRate > 0.8 && diffInfo.level < 10) {
      diffInfo.level += 1;
      diffInfo.sessionCorrect = 0;
      diffInfo.sessionTotal = 0;
    } else if (successRate < 0.5 && diffInfo.level > 1) {
      diffInfo.level -= 1;
      diffInfo.sessionCorrect = 0;
      diffInfo.sessionTotal = 0;
    } else if (diffInfo.sessionTotal >= 10) {
      diffInfo.sessionCorrect = 0;
      diffInfo.sessionTotal = 0;
    }
  }
  
  // Update daily progress
  let todayProgress = progress.dailyProgress.find(d => d.date === today);
  if (!todayProgress) {
    todayProgress = { date: today, points: 0, exercisesCompleted: [], exerciseResults: {} };
    progress.dailyProgress.push(todayProgress);
  }
  todayProgress.points += result.score;
  if (!todayProgress.exercisesCompleted.includes(result.type)) {
    todayProgress.exercisesCompleted.push(result.type);
  }
  
  // Track exercise results for statistics
  if (!todayProgress.exerciseResults) {
    todayProgress.exerciseResults = {};
  }
  if (!todayProgress.exerciseResults[result.type]) {
    todayProgress.exerciseResults[result.type] = { correct: 0, total: 0, difficultyLevel: diffInfo.level };
  }
  todayProgress.exerciseResults[result.type]!.correct += result.correctAnswers;
  todayProgress.exerciseResults[result.type]!.total += result.totalQuestions;
  todayProgress.exerciseResults[result.type]!.difficultyLevel = diffInfo.level;
  
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

export function getDailyPointsHistory(days: number = 14): { date: string; points: number }[] {
  const progress = getProgress();
  const result: { date: string; points: number }[] = [];
  
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayProgress = progress.dailyProgress.find(d => d.date === dateStr);
    result.push({
      date: dateStr,
      points: dayProgress?.points || 0,
    });
  }
  
  return result;
}

export function getSuccessRatesByType(): { type: ExerciseType; rate: number; total: number }[] {
  const progress = getProgress();
  const types: ExerciseType[] = ['logic', 'memory', 'math', 'words'];
  
  return types.map(type => {
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    progress.dailyProgress.forEach(day => {
      if (day.exerciseResults?.[type]) {
        totalCorrect += day.exerciseResults[type]!.correct;
        totalQuestions += day.exerciseResults[type]!.total;
      }
    });
    
    return {
      type,
      rate: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
      total: totalQuestions,
    };
  });
}

export function getDifficultyHistory(days: number = 14): { date: string; levels: { [key in ExerciseType]?: number } }[] {
  const progress = getProgress();
  const result: { date: string; levels: { [key in ExerciseType]?: number } }[] = [];
  
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayProgress = progress.dailyProgress.find(d => d.date === dateStr);
    
    const levels: { [key in ExerciseType]?: number } = {};
    if (dayProgress?.exerciseResults) {
      (['logic', 'memory', 'math', 'words'] as ExerciseType[]).forEach(type => {
        if (dayProgress.exerciseResults?.[type]) {
          levels[type] = dayProgress.exerciseResults[type]!.difficultyLevel;
        }
      });
    }
    
    result.push({ date: dateStr, levels });
  }
  
  return result;
}
