import { useState } from 'react';
import type { SharedStats } from '../utils/social';
import { EXERCISE_TYPES, EXERCISE_LABELS } from '../utils/social';

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function NameModal({ onSave, onClose }: { onSave: (n: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-2">👋 Dein Profil</h2>
      <p className="text-gray-500 text-sm mb-4">Wie sollen dich deine Freunde nennen?</p>
      <input
        autoFocus
        value={name}
        maxLength={24}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name)}
        placeholder="Dein Name"
        className="w-full border border-gray-300 rounded-xl px-4 py-2 mb-4"
      />
      <div className="flex gap-2 justify-end">
        <button className="px-4 py-2 rounded-xl bg-gray-100" onClick={onClose}>Abbrechen</button>
        <button disabled={!name.trim()} className="px-4 py-2 rounded-xl bg-primary-600 text-white disabled:opacity-40" onClick={() => onSave(name)}>Speichern</button>
      </div>
    </Modal>
  );
}

export function ShareModal({ link, onClose }: { link: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.getElementById('share-link') as HTMLTextAreaElement | null;
      el?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-2">📤 Fortschritt teilen</h2>
      <p className="text-gray-500 text-sm mb-3">Schicke diesen Link an deine Freunde. Er enthält deine aktuellen Stats.</p>
      <textarea id="share-link" readOnly value={link} rows={4} onFocus={e => e.target.select()} className="w-full border border-gray-300 rounded-xl p-2 text-xs break-all mb-3" />
      <div className="flex gap-2 justify-end">
        <button className="px-4 py-2 rounded-xl bg-gray-100" onClick={onClose}>Schließen</button>
        <button className="px-4 py-2 rounded-xl bg-primary-600 text-white" onClick={copy}>{copied ? '✓ Kopiert!' : '📋 Link kopieren'}</button>
      </div>
    </Modal>
  );
}

function Row({ label, a, b }: { label: string; a: number; b: number }) {
  const cls = (x: number, y: number) =>
    x > y ? 'bg-green-100 text-green-700 font-bold' : x < y ? 'text-gray-500' : 'bg-gray-100 text-gray-600';
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1.5 text-center">
      <div className={`rounded-lg py-1 ${cls(a, b)}`}>{a}{a > b && ' 👑'}</div>
      <div className="text-xs text-gray-400 w-28">{label}</div>
      <div className={`rounded-lg py-1 ${cls(b, a)}`}>{b}{b > a && ' 👑'}</div>
    </div>
  );
}

export function CompareModal({ me, friend, onClose }: { me: SharedStats; friend: SharedStats; onClose: () => void }) {
  let mine = 0;
  let theirs = 0;
  const tally = (a: number, b: number) => { if (a > b) mine++; else if (b > a) theirs++; };
  tally(me.points, friend.points);
  tally(me.streak, friend.streak);
  tally(me.level, friend.level);
  EXERCISE_TYPES.forEach(t => { tally(me.ex[t].p, friend.ex[t].p); tally(me.ex[t].l, friend.ex[t].l); });
  const verdict = mine > theirs ? '🎉 Du liegst vorne!' : mine < theirs ? `💪 ${friend.name} liegt vorne!` : '🤝 Gleichstand!';
  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold text-center mb-1">⚔️ Vergleich</h2>
      <p className="text-center text-sm text-gray-500 mb-4">{verdict} ({mine} : {theirs})</p>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-center font-semibold mb-2">
        <div className="text-primary-600 truncate">Du ({me.name})</div>
        <div className="w-28 text-gray-400">vs.</div>
        <div className="text-accent-600 truncate">{friend.name}</div>
      </div>
      <Row label="Gesamtpunkte" a={me.points} b={friend.points} />
      <Row label="🔥 Streak" a={me.streak} b={friend.streak} />
      <Row label="Level" a={me.level} b={friend.level} />
      <div className="border-t my-2" />
      {EXERCISE_TYPES.map(t => (
        <div key={t} className="mb-2">
          <div className="text-xs text-center text-gray-500 mt-2">{EXERCISE_LABELS[t]}</div>
          <Row label="Punkte" a={me.ex[t].p} b={friend.ex[t].p} />
          <Row label="Level" a={me.ex[t].l} b={friend.ex[t].l} />
        </div>
      ))}
      <button className="w-full mt-3 px-4 py-2 rounded-xl bg-primary-600 text-white" onClick={onClose}>
        {friend.name} zu Freunden hinzugefügt – Schließen
      </button>
    </Modal>
  );
}

export function FriendsModal({ me, friends, onCompare, onRemove, onClose }: {
  me: SharedStats; friends: SharedStats[]; onCompare: (f: SharedStats) => void; onRemove: (id: string) => void; onClose: () => void;
}) {
  const all = [{ ...me, isMe: true }, ...friends.map(f => ({ ...f, isMe: false }))].sort((a, b) => b.points - a.points);
  const top = all.slice(0, 3);
  const order = top.length >= 3 ? [1, 0, 2] : top.length === 2 ? [1, 0] : [0];
  const heights = ['h-28', 'h-20', 'h-14'];
  const medals = ['🥇', '🥈', '🥉'];
  const maxLevel = (s: SharedStats) => Math.max(...EXERCISE_TYPES.map(t => s.ex[t].l));
  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold text-center mb-4">🏆 Rangliste</h2>
      <div className="flex items-end justify-center gap-2 mb-6">
        {order.map(idx => {
          const p = top[idx];
          return (
            <div key={p.id} className="flex-1 text-center">
              <div className="text-2xl">{medals[idx]}</div>
              <div className={`text-sm font-semibold truncate ${p.isMe ? 'text-primary-600' : ''}`}>{p.name}{p.isMe && ' (Du)'}</div>
              <div className="text-xs text-gray-500 mb-1">{p.points} P.</div>
              <div className={`${heights[idx]} rounded-t-xl bg-gradient-to-t from-primary-500 to-accent-400`} />
            </div>
          );
        })}
      </div>
      <ul className="space-y-2">
        {all.map((p, i) => (
          <li key={p.id} className={`flex items-center gap-3 rounded-xl p-3 ${p.isMe ? 'bg-primary-50' : 'bg-gray-50'}`}>
            <span className="w-6 text-center font-bold text-gray-500">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{p.name}{p.isMe && ' (Du)'}</div>
              <div className="text-xs text-gray-500">{p.points} Punkte · 🔥 {p.streak} · Höchstes Level {maxLevel(p)}</div>
            </div>
            {!p.isMe && (
              <>
                <button className="text-xs px-2 py-1 rounded-lg bg-white border" onClick={() => onCompare(p)}>Vergleich</button>
                <button className="text-xs px-2 py-1 rounded-lg bg-white border text-red-500" aria-label="Entfernen" onClick={() => onRemove(p.id)}>✕</button>
              </>
            )}
          </li>
        ))}
      </ul>
      <button className="w-full mt-4 px-4 py-2 rounded-xl bg-gray-100" onClick={onClose}>Schließen</button>
    </Modal>
  );
}
