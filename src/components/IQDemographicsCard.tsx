import { useState } from 'react';
import {
  GENDER_LABELS,
  getAgeYears,
  loadBrainmasterProfile,
  saveBrainmasterProfile,
  type BrainmasterProfile,
  type Gender,
} from '../iq/demographics';

interface IQDemographicsCardProps {
  compact?: boolean;
  onSaved?: () => void;
}

export default function IQDemographicsCard({ compact, onSaved }: IQDemographicsCardProps) {
  const existing = loadBrainmasterProfile();
  const [birthYear, setBirthYear] = useState(
    existing?.birthYear ? String(existing.birthYear) : '',
  );
  const [ageYears, setAgeYears] = useState(
    existing?.ageYears ? String(existing.ageYears) : '',
  );
  const [gender, setGender] = useState<Gender>(existing?.gender ?? 'none');
  const [saved, setSaved] = useState(false);

  const save = () => {
    const profile: BrainmasterProfile = { gender };
    const year = parseInt(birthYear, 10);
    const age = parseInt(ageYears, 10);
    if (!Number.isNaN(age) && age > 0 && age < 120) profile.ageYears = age;
    else if (!Number.isNaN(year) && year > 1900 && year <= new Date().getFullYear()) {
      profile.birthYear = year;
    }
    saveBrainmasterProfile(profile);
    setSaved(true);
    onSaved?.();
    setTimeout(() => setSaved(false), 2500);
  };

  const previewAge = getAgeYears({
    birthYear: birthYear ? parseInt(birthYear, 10) : undefined,
    ageYears: ageYears ? parseInt(ageYears, 10) : undefined,
    gender,
  });

  return (
    <section className={compact ? '' : 'card mb-4 border border-blue-100'}>
      {!compact && (
        <>
          <h2 className="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-1">IQ-Profil</h2>
          <p className="text-xs text-gray-500 mb-3">
            Nur für die Ergebnis-Einordnung — freiwillig, lokal gespeichert. Keine klinische Norm.
          </p>
        </>
      )}
      <div className={`grid gap-3 ${compact ? '' : ''}`}>
        <label className="block text-sm">
          <span className="text-gray-700 font-medium">Alter in Jahren</span>
          <input
            type="number"
            min={6}
            max={110}
            inputMode="numeric"
            value={ageYears}
            onChange={e => setAgeYears(e.target.value)}
            placeholder="z. B. 34"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">oder Geburtsjahr</span>
          <input
            type="number"
            min={1920}
            max={new Date().getFullYear()}
            inputMode="numeric"
            value={birthYear}
            onChange={e => setBirthYear(e.target.value)}
            placeholder="z. B. 1990"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700 font-medium">Geschlecht (optional)</span>
          <select
            value={gender}
            onChange={e => setGender(e.target.value as Gender)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
          >
            {(Object.keys(GENDER_LABELS) as Gender[]).map(g => (
              <option key={g} value={g}>
                {GENDER_LABELS[g]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {previewAge !== null && (
        <p className="text-xs text-blue-700 mt-2">Auswertung mit grober Altersorientierung ({previewAge} Jahre).</p>
      )}
      <button
        type="button"
        onClick={save}
        className={`mt-3 w-full py-2.5 rounded-xl font-semibold text-sm ${
          compact ? 'bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {saved ? 'Gespeichert ✓' : 'Profil speichern'}
      </button>
    </section>
  );
}