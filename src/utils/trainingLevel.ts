import type { ExerciseType } from '../types';
import { getOnboarding } from './onboarding';
import { loadHistory } from '../iq/questions';
import { getProgress, saveProgress, getPointsForCurrentLevel } from './storage';

const META_KEY = 'brainmaster_training_level_meta';

export type LevelSource = 'iq' | 'placement' | 'default';

export interface TrainingLevelMeta {
  placementLevel: number | null;
  lastIq: number | null;
  iqSetAt: string | null;
}

export interface EffectiveLevelInfo {
  effective: number;
  source: LevelSource;
  placementLevel: number | null;
  iqLevel: number | null;
  lastIq: number | null;
}

const EXERCISES: ExerciseType[] = ['logic', 'memory', 'math', 'words'];

/** Übungsstufe 1–10 aus geschätztem IQ (70 ≈ Stufe 1, 100 ≈ 4, 130 ≈ 8). */
export function iqToTrainingLevel(iq: number): number {
  return Math.min(10, Math.max(1, Math.round((iq - 62) / 9)));
}

export function getTrainingLevelMeta(): TrainingLevelMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw) as TrainingLevelMeta;
  } catch {
    /* ignore */
  }
  return { placementLevel: null, lastIq: null, iqSetAt: null };
}

function saveTrainingLevelMeta(patch: Partial<TrainingLevelMeta>): void {
  const next = { ...getTrainingLevelMeta(), ...patch };
  localStorage.setItem(META_KEY, JSON.stringify(next));
}

export function applyPlacementLevel(level: number): void {
  const lvl = Math.min(10, Math.max(1, Math.round(level)));
  const progress = getProgress();
  for (const type of EXERCISES) {
    progress.difficulty[type].level = lvl;
    progress.difficulty[type].sessionCorrect = 0;
    progress.difficulty[type].sessionTotal = 0;
  }
  const floorPoints = getPointsForCurrentLevel(lvl);
  if (progress.totalPoints < floorPoints) {
    progress.totalPoints = floorPoints;
    progress.level = lvl;
  }
  saveProgress(progress);
  saveTrainingLevelMeta({ placementLevel: lvl });
}

export function applyIQTrainingLevel(iq: number): void {
  const lvl = iqToTrainingLevel(iq);
  const progress = getProgress();
  for (const type of EXERCISES) {
    progress.difficulty[type].level = lvl;
    progress.difficulty[type].sessionCorrect = 0;
    progress.difficulty[type].sessionTotal = 0;
  }
  saveProgress(progress);
  saveTrainingLevelMeta({ lastIq: iq, iqSetAt: new Date().toISOString() });
}

/** effectiveLevel = IQ-Test absolviert ? Stufe aus IQ : Stufe aus Einstufung */
export function getEffectiveLevelInfo(): EffectiveLevelInfo {
  const onboarding = getOnboarding();
  const placementLevel = onboarding?.startLevel ?? getTrainingLevelMeta().placementLevel;
  const history = loadHistory();
  const lastIq = history.length > 0 ? history[history.length - 1].iq : null;
  const iqLevel = lastIq != null ? iqToTrainingLevel(lastIq) : null;
  const iqDone = history.length > 0;

  let effective = 1;
  let source: LevelSource = 'default';
  if (iqDone && iqLevel != null) {
    effective = iqLevel;
    source = 'iq';
  } else if (placementLevel != null && placementLevel >= 1) {
    effective = placementLevel;
    source = 'placement';
  }

  return {
    effective,
    source,
    placementLevel: placementLevel ?? null,
    iqLevel,
    lastIq,
  };
}

export function effectiveLevelHint(info: EffectiveLevelInfo): string | null {
  if (info.source !== 'iq' || info.placementLevel == null) return null;
  if (info.placementLevel === info.effective) return null;
  return `Einstufung Stufe ${info.placementLevel} — angepasst auf Stufe ${info.effective} nach IQ-Test (IQ ${info.lastIq}).`;
}
