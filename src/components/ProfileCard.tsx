import { useMemo, useState } from 'react';
import type { UserProgress } from '../types';
import { NAME_KEY, avatarFor, buildProfile, renderCardPng } from '../utils/profile';

export default function ProfileCard({ progress, onClose }: { progress: UserProgress; onClose: () => void }) {
  const [name, setName] = useState(localStorage.getItem(NAME_KEY) || '');
  const [msg, setMsg] = useState('');
  const pr = useMemo(() => buildProfile(progress), [progress, name]);
  const av = avatarFor(name);

  const changeName = (v: string) => {
    setName(v);
    localStorage.setItem(NAME_KEY, v.trim());
  };

  const save = async () => {
    const blob = await renderCardPng(pr);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'brainmaster-trainerkarte.png';
    a.click();
    setMsg('Bild gespeichert!');
  };

  const share = async () => {
    const text = `Meine Brainmaster Trainer-Karte: ${pr.rank.title}, Level ${pr.level}, ${pr.streak} Tage Streak 🔥`;
    try {
      const blob = await renderCardPng(pr);
      const file = new File([blob], 'trainerkarte.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: 'Brainmaster' });
      } else if (navigator.share) {
        await navigator.share({ text, url: location.href, title: 'Brainmaster' });
      } else {
        await navigator.clipboard.writeText(`${text} ${location.href}`);
        setMsg('Link in die Zwischenablage kopiert!');
      }
    } catch {
      /* abgebrochen */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto text-left" onClick={onClose}>
      <div className="w-full max-w-sm my-auto" onClick={e => e.stopPropagation()}>
        <div className="rounded-3xl p-1 shadow-2xl" style={{ background: `linear-gradient(135deg, ${pr.rank.from}, ${pr.rank.to})` }}>
          <div className="rounded-[22px] border-2 border-white/50 p-5 text-white text-center">
            <div className="font-bold tracking-widest text-sm">🧠 BRAINMASTER</div>
            <div className="w-24 h-24 rounded-full mx-auto mt-3 flex items-center justify-center text-5xl border-4 border-white" style={{ background: av.bg }}>
              {av.emoji}
            </div>
            <input
              value={name}
              onChange={e => changeName(e.target.value)}
              placeholder="Dein Name"
              maxLength={20}
              className="mt-3 w-full bg-transparent text-center text-2xl font-bold placeholder-white/60 outline-none border-b border-white/30"
            />
            <div className="font-semibold mt-1">{pr.rank.emoji} {pr.rank.title}</div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <Stat label="Gesamt-Level" value={String(pr.level)} />
              <Stat label="IQ" value={pr.iq ? String(pr.iq) : '–'} />
              <Stat label="Streak" value={`🔥 ${pr.streak}`} />
            </div>

            <div className="mt-4 space-y-2">
              {pr.bars.map(b => (
                <div key={b.type} className="flex items-center gap-2 text-sm">
                  <span className="w-20 text-left font-semibold">{b.emoji} {b.label}</span>
                  <div className="flex-1 h-3 rounded-full bg-black/30 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${b.value * 10}%`, background: b.color }} />
                  </div>
                  <span className="w-10 text-right">{b.value}/10</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-4 text-sm font-semibold">
              <span>{pr.ach.unlocked}/{pr.ach.total} 🏆 Achievements</span>
              <span>📅 {pr.days} Trainings-Tage</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button onClick={save} className="flex-1 py-2 rounded-xl bg-white font-semibold text-gray-800">💾 Als Bild speichern</button>
          <button onClick={share} className="flex-1 py-2 rounded-xl bg-white font-semibold text-gray-800">📤 Teilen</button>
        </div>
        {msg && <p className="text-center text-white text-sm mt-2">{msg}</p>}
        <button onClick={onClose} className="w-full mt-2 py-2 rounded-xl bg-white/20 text-white">Schliessen</button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/20 py-2">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
