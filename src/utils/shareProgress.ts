import type { SharedStats } from './social';
import { createShareLink, EXERCISE_LABELS, EXERCISE_TYPES } from './social';

export function formatShareMessage(stats: SharedStats): string {
  const parts = EXERCISE_TYPES.map(t => `${EXERCISE_LABELS[t].replace(/^.\s/, '')} L${stats.ex[t].l}`);
  return (
    `${stats.name} bei Brainmaster: Level ${stats.level}, ${stats.points} Punkte, ` +
    `🔥 ${stats.streak}-Tage-Streak.\n` +
    `Übungen: ${parts.join(' · ')}`
  );
}

/** Lesbarer https-Link nur wenn keine lokale/Capacitor-URL. */
export function publicShareUrl(stats: SharedStats): string | null {
  const full = createShareLink(stats);
  try {
    const u = new URL(full);
    if (u.protocol === 'capacitor:' || u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return null;
    }
    if (u.protocol === 'https:' || u.protocol === 'http:') return full;
  } catch {
    return null;
  }
  return null;
}

export async function shareStatsNative(stats: SharedStats): Promise<'shared' | 'cancelled' | 'fallback'> {
  const link = publicShareUrl(stats);
  const text = link ? `${formatShareMessage(stats)}\n\n${link}` : formatShareMessage(stats);
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Brainmaster — Fortschritt',
        text,
        url: link ?? undefined,
      });
      return 'shared';
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return 'cancelled';
  }
  const subject = encodeURIComponent(`${stats.name} — Brainmaster Stats`);
  const body = encodeURIComponent(text);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
  return 'fallback';
}