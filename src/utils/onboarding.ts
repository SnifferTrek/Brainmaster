export type OnboardingMode = 'measure' | 'practice';

const KEY = 'gehirntraining_onboarding';

interface OnboardingState {
  completed: boolean;
  mode: OnboardingMode;
  startLevel: number | null;
}

export function getOnboarding(): OnboardingState | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function isOnboardingDone(): boolean {
  return !!getOnboarding()?.completed;
}

export function saveOnboarding(mode: OnboardingMode, startLevel: number | null): void {
  const prev = getOnboarding();
  localStorage.setItem(KEY, JSON.stringify({
    completed: true,
    mode: startLevel === null && prev?.startLevel ? prev.mode : mode,
    startLevel: startLevel ?? prev?.startLevel ?? null,
  }));
}
