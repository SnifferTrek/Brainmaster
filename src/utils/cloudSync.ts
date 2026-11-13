import { Capacitor, registerPlugin } from '@capacitor/core';

interface ICloudSyncPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  save(opts: { json: string }): Promise<void>;
  load(): Promise<{ json?: string }>;
}

const ICloudSync = registerPlugin<ICloudSyncPlugin>('ICloudSync');

const JSON_KEYS = [
  'gehirntraining_progress',
  'gehirntraining_achievements',
  'brainmaster_iq_history',
] as const;
const STRING_KEYS = ['gehirntraining_username', 'gehirntraining_iq', 'gehirntraining_goal'] as const;
const SYNCED_KEYS: string[] = [...JSON_KEYS, ...STRING_KEYS];
const MODIFIED_KEY = 'brainmaster_sync_modified';

export interface CloudData {
  version: 1;
  updatedAt: number;
  json: Record<string, unknown>;
  strings: Record<string, string>;
}

type Obj = Record<string, any>;

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

function readJson(key: string): unknown {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : undefined;
  } catch {
    return undefined;
  }
}

export function collectLocal(): CloudData {
  const json: Record<string, unknown> = {};
  for (const k of JSON_KEYS) {
    const v = readJson(k);
    if (v !== undefined) json[k] = v;
  }
  const strings: Record<string, string> = {};
  for (const k of STRING_KEYS) {
    const v = localStorage.getItem(k);
    if (v !== null) strings[k] = v;
  }
  return { version: 1, updatedAt: Number(localStorage.getItem(MODIFIED_KEY)) || 0, json, strings };
}

function mergeProgress(a: Obj | undefined, b: Obj | undefined): Obj | undefined {
  if (!a) return b;
  if (!b) return a;
  const [win, lose] = (b.totalPoints || 0) > (a.totalPoints || 0) ? [b, a] : [a, b];
  const out: Obj = { ...lose, ...win };
  out.longestStreak = Math.max(a.longestStreak || 0, b.longestStreak || 0);
  const streakSrc = (a.currentStreak || 0) >= (b.currentStreak || 0) ? a : b;
  out.currentStreak = streakSrc.currentStreak || 0;
  out.lastPlayedDate = [a.lastPlayedDate, b.lastPlayedDate].filter(Boolean).sort().pop() ?? null;
  out.gamesPlayed = Math.max(a.gamesPlayed || 0, b.gamesPlayed || 0);
  out.level = Math.max(a.level || 1, b.level || 1);
  out.trainingDays = Math.max(a.trainingDays || 0, b.trainingDays || 0);

  out.exerciseStats = {};
  for (const t of new Set([...Object.keys(a.exerciseStats || {}), ...Object.keys(b.exerciseStats || {})])) {
    const x = a.exerciseStats?.[t];
    const y = b.exerciseStats?.[t];
    out.exerciseStats[t] = !x ? y : !y ? x : (y.totalPoints || 0) > (x.totalPoints || 0)
      ? { ...x, ...y, bestScore: Math.max(x.bestScore || 0, y.bestScore || 0) }
      : { ...y, ...x, bestScore: Math.max(x.bestScore || 0, y.bestScore || 0) };
  }

  out.difficulty = {};
  for (const t of new Set([...Object.keys(a.difficulty || {}), ...Object.keys(b.difficulty || {})])) {
    const x = a.difficulty?.[t];
    const y = b.difficulty?.[t];
    out.difficulty[t] = !x ? y : !y ? x : (y.level || 1) > (x.level || 1) ? y : x;
  }

  const days = new Map<string, Obj>();
  for (const d of [...(lose.dailyProgress || []), ...(win.dailyProgress || [])]) {
    const prev = days.get(d.date);
    if (!prev || (d.points || 0) >= (prev.points || 0)) days.set(d.date, d);
  }
  out.dailyProgress = [...days.values()].sort((p, q) => String(p.date).localeCompare(String(q.date)));
  return out;
}

function mergeAchievements(a: Obj | undefined, b: Obj | undefined): Obj | undefined {
  if (!a) return b;
  if (!b) return a;
  const out: Obj = { ...a, ...b, achievements: { ...(a.achievements || {}) } };
  for (const [id, date] of Object.entries<any>(b.achievements || {})) {
    const cur = out.achievements[id];
    out.achievements[id] = !cur ? date : !date ? cur : String(date) < String(cur) ? date : cur;
  }
  return out;
}

function mergeHistory(a: unknown, b: unknown): unknown[] | undefined {
  if (!Array.isArray(a)) return Array.isArray(b) ? b : undefined;
  if (!Array.isArray(b)) return a;
  const seen = new Set<string>();
  const out: unknown[] = [];
  for (const e of [...a, ...b]) {
    const k = JSON.stringify(e);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(e);
    }
  }
  return out;
}

export function mergeData(local: CloudData, cloud: CloudData): CloudData {
  const json: Record<string, unknown> = {};
  const lj = local.json as Obj;
  const cj = cloud.json as Obj;
  const p = mergeProgress(lj.gehirntraining_progress, cj.gehirntraining_progress);
  if (p) json.gehirntraining_progress = p;
  const ach = mergeAchievements(lj.gehirntraining_achievements, cj.gehirntraining_achievements);
  if (ach) json.gehirntraining_achievements = ach;
  const hist = mergeHistory(lj.brainmaster_iq_history, cj.brainmaster_iq_history);
  if (hist) json.brainmaster_iq_history = hist;

  const newer = cloud.updatedAt > local.updatedAt ? cloud : local;
  const older = newer === cloud ? local : cloud;
  const strings = { ...older.strings, ...newer.strings };
  return { version: 1, updatedAt: Math.max(local.updatedAt, cloud.updatedAt), json, strings };
}

let applying = false;

function applyLocal(data: CloudData): void {
  applying = true;
  try {
    for (const [k, v] of Object.entries(data.json)) localStorage.setItem(k, JSON.stringify(v));
    for (const [k, v] of Object.entries(data.strings)) localStorage.setItem(k, v);
    localStorage.setItem(MODIFIED_KEY, String(data.updatedAt));
  } finally {
    applying = false;
  }
}

export async function saveToCloud(data: CloudData = collectLocal()): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    await ICloudSync.save({ json: JSON.stringify(data) });
    return true;
  } catch (e) {
    console.warn('iCloud-Speichern fehlgeschlagen', e);
    return false;
  }
}

export async function loadFromCloud(): Promise<CloudData | null> {
  if (!isNativeApp()) return null;
  try {
    const { json } = await ICloudSync.load();
    if (!json) return null;
    const parsed = JSON.parse(json) as CloudData;
    return parsed?.version === 1 ? parsed : null;
  } catch (e) {
    console.warn('iCloud-Laden fehlgeschlagen', e);
    return null;
  }
}

/** Führt lokale und Cloud-Daten zusammen (höhere Punkte/längerer Streak gewinnt, Erfolge werden vereint). */
export async function syncData(): Promise<CloudData | null> {
  if (!isNativeApp()) return null;
  const local = collectLocal();
  const cloud = await loadFromCloud();
  const merged = cloud ? mergeData(local, cloud) : local;
  applyLocal(merged);
  await saveToCloud(merged);
  return merged;
}

let timer: ReturnType<typeof setTimeout> | undefined;

function scheduleSave() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    void saveToCloud();
  }, 1500);
}

/** Beim Start synchronisieren und danach jede Änderung automatisch in iCloud sichern. */
export async function initCloudSync(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    await Promise.race([syncData(), new Promise(r => setTimeout(r, 4000))]);
  } catch (e) {
    console.warn('Sync fehlgeschlagen, nutze lokale Daten', e);
  }
  const orig = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key: string, value: string) {
    orig.call(this, key, value);
    if (!applying && this === localStorage && SYNCED_KEYS.includes(key)) {
      orig.call(this, MODIFIED_KEY, String(Date.now()));
      scheduleSave();
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void saveToCloud();
  });
}
