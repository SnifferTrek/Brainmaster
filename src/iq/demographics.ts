export type Gender = 'none' | 'male' | 'female' | 'diverse';

export interface BrainmasterProfile {
  birthYear?: number;
  /** Wenn gesetzt, hat Vorrang vor Geburtsjahr. */
  ageYears?: number;
  gender?: Gender;
}

export const PROFILE_KEY = 'brainmaster_profile';

export const GENDER_LABELS: Record<Gender, string> = {
  none: 'Keine Angabe',
  male: 'Männlich',
  female: 'Weiblich',
  diverse: 'Divers',
};

export type AgeBand = 'under18' | '18_29' | '30_49' | '50_64' | '65plus';

export const AGE_BAND_LABELS: Record<AgeBand, string> = {
  under18: 'unter 18',
  '18_29': '18–29',
  '30_49': '30–49',
  '50_64': '50–64',
  '65plus': '65+',
};

export function loadBrainmasterProfile(): BrainmasterProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as BrainmasterProfile;
    if (!p || typeof p !== 'object') return null;
    return p;
  } catch {
    return null;
  }
}

export function saveBrainmasterProfile(profile: BrainmasterProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getAgeYears(profile: BrainmasterProfile | null): number | null {
  if (!profile) return null;
  if (typeof profile.ageYears === 'number' && profile.ageYears > 0 && profile.ageYears < 120) {
    return Math.round(profile.ageYears);
  }
  if (typeof profile.birthYear === 'number' && profile.birthYear > 1900) {
    const age = new Date().getFullYear() - profile.birthYear;
    return age > 0 && age < 120 ? age : null;
  }
  return null;
}

export function ageBand(age: number): AgeBand {
  if (age < 18) return 'under18';
  if (age < 30) return '18_29';
  if (age < 50) return '30_49';
  if (age < 65) return '50_64';
  return '65plus';
}

/** Nur erklärender Text — keine klinische Normskala. */
export function ageInterpretationHint(age: number | null): string {
  if (age === null) {
    return 'Ohne Altersangabe: Einordnung orientiert sich an der allgemeinen App-Norm (Schätzwert, kein klinischer Test).';
  }
  const band = AGE_BAND_LABELS[ageBand(age)];
  return `Orientierung für Alter ${age} (${band}): Grobe Einordnung — kein WAIS- oder klinischer Normwert.`;
}

export function profileSummaryLine(profile: BrainmasterProfile | null): string {
  const age = getAgeYears(profile);
  const gender = profile?.gender ?? 'none';
  const parts: string[] = [];
  if (age !== null) parts.push(`Alter ${age}`);
  if (gender !== 'none') parts.push(GENDER_LABELS[gender]);
  return parts.length ? parts.join(' · ') : 'Profil unvollständig (optional)';
}

export function isProfileEmpty(profile: BrainmasterProfile | null): boolean {
  if (!profile) return true;
  return getAgeYears(profile) === null && (profile.gender === undefined || profile.gender === 'none');
}