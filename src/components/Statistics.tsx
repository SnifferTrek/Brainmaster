import { useMemo, useState } from 'react';
import type { UserProgress, ExerciseType } from '../types';
import { 
  getDailyPointsHistory, 
  getSuccessRatesByType, 
  getDifficultyHistory,
  getDifficultyLabel 
} from '../utils/storage';
import { loadHistory as loadIQHistory, CATEGORY_INFO, CATEGORY_ORDER } from '../iq/questions';
import type { IQResult } from '../iq/questions';

interface StatisticsProps {
  progress: UserProgress;
  onBack: () => void;
}

const exerciseInfo: { type: ExerciseType; name: string; emoji: string; color: string }[] = [
  { type: 'logic', name: 'Logik', emoji: '🧩', color: '#3B82F6' },
  { type: 'memory', name: 'Gedächtnis', emoji: '🃏', color: '#8B5CF6' },
  { type: 'math', name: 'Mathe', emoji: '🧮', color: '#10B981' },
  { type: 'words', name: 'Wörter', emoji: '📝', color: '#F59E0B' },
];

function SimpleLineChart({ 
  data, 
  height = 200,
  color = '#6366F1',
  showLabels = true 
}: { 
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  showLabels?: boolean;
}) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1 || 1)) * 100,
    y: 100 - (d.value / maxValue) * 100,
    ...d,
  }));
  
  const pathD = points.length > 0 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
    : '';
  
  const areaD = points.length > 0
    ? `M ${points[0].x},100 L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},100 Z`
    : '';

  return (
    <div className="relative" style={{ height }}>
      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="#E5E7EB"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        
        {areaD && (
          <path
            d={areaD}
            fill={`url(#gradient-${color.replace('#', '')})`}
          />
        )}
        
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.5"
            fill={color}
            className="hover:r-3 transition-all"
          />
        ))}
      </svg>
      
      {showLabels && (
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1).map((d, i) => (
            <span key={i}>{d.label.slice(5)}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiLineChart({ 
  data,
  height = 200,
}: { 
  data: { date: string; levels: { [key in ExerciseType]?: number } }[];
  height?: number;
}) {
  const types = exerciseInfo;
  
  return (
    <div className="relative" style={{ height }}>
      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="#E5E7EB"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        
        {types.map(({ type, color }) => {
          const points = data
            .map((d, i) => {
              const level = d.levels[type];
              if (level === undefined) return null;
              return {
                x: (i / (data.length - 1 || 1)) * 100,
                y: 100 - ((level - 1) / 9) * 100,
              };
            })
            .filter(Boolean) as { x: number; y: number }[];
          
          if (points.length < 2) return null;
          
          const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
          
          return (
            <g key={type}>
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="1.5"
                  fill={color}
                />
              ))}
            </g>
          );
        })}
      </svg>
      
      <div className="absolute right-0 top-0 text-xs text-gray-400">
        <div>Stufe 10</div>
      </div>
      <div className="absolute right-0 bottom-0 text-xs text-gray-400">
        <div>Stufe 1</div>
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1).map((d, i) => (
          <span key={i}>{d.date.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}

type StatSection = 'overview' | 'iq' | 'exercises' | 'levels';

const SECTIONS: { id: StatSection; label: string; icon: string }[] = [
  { id: 'overview', label: 'Übersicht', icon: '📈' },
  { id: 'iq', label: 'IQ', icon: '🧠' },
  { id: 'exercises', label: 'Übungen', icon: '🎯' },
  { id: 'levels', label: 'Stufen', icon: '📊' },
];

export default function Statistics({ progress, onBack }: StatisticsProps) {
  const [section, setSection] = useState<StatSection>('overview');
  const dailyPoints = useMemo(() => getDailyPointsHistory(14), []);
  const successRates = useMemo(() => getSuccessRatesByType(), []);
  const difficultyHistory = useMemo(() => getDifficultyHistory(14), []);
  const iqHistory = useMemo(() => loadIQHistory(), []);
  
  const totalPointsLast14Days = dailyPoints.reduce((sum, d) => sum + d.points, 0);
  const avgPointsPerDay = totalPointsLast14Days / 14;
  const activeDays = dailyPoints.filter(d => d.points > 0).length;
  
  const chartData = dailyPoints.map(d => ({
    label: d.date,
    value: d.points,
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-28">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={onBack} 
          className="text-gray-500 hover:text-gray-700 flex items-center gap-2 text-sm"
        >
          <span>←</span> Zurück
        </button>
        <h1 className="text-xl font-bold text-gray-800">📊 Statistiken</h1>
        <div className="w-14" />
      </div>

      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              section === s.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {section === 'overview' && (
      <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card text-center">
          <div className="text-3xl mb-1">📈</div>
          <div className="text-2xl font-bold text-gray-800">{totalPointsLast14Days}</div>
          <div className="text-sm text-gray-500">Punkte (14 Tage)</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-1">📅</div>
          <div className="text-2xl font-bold text-gray-800">{activeDays}</div>
          <div className="text-sm text-gray-500">Aktive Tage</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-1">⚡</div>
          <div className="text-2xl font-bold text-gray-800">{avgPointsPerDay.toFixed(0)}</div>
          <div className="text-sm text-gray-500">Ø Punkte/Tag</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-1">🎮</div>
          <div className="text-2xl font-bold text-gray-800">{progress.gamesPlayed}</div>
          <div className="text-sm text-gray-500">Spiele gesamt</div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📈</span> Punkte pro Tag
        </h2>
        <p className="text-sm text-gray-500 mb-4">Dein Punkteverlauf der letzten 14 Tage</p>
        <SimpleLineChart data={chartData} color="#6366F1" height={160} />
      </div>
      </>
      )}

      {section === 'iq' && (
        iqHistory.length > 0 ? (
          <div className="card mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🧠</span> IQ-Test Verlauf
            </h2>
            <IQTrendCard history={iqHistory} />
          </div>
        ) : (
          <div className="card text-center text-gray-500 py-8">Noch kein IQ-Test absolviert.</div>
        )
      )}

      {section === 'exercises' && (
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🎯</span> Erfolgsrate pro Übungstyp
        </h2>
        <p className="text-sm text-gray-500 mb-6">Wie oft antwortest du richtig?</p>
        
        {successRates.map(({ type, rate, total }) => {
          const info = exerciseInfo.find(e => e.type === type)!;
          return (
            <div key={type} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{info.emoji}</span>
                <span className="font-medium text-gray-700">{info.name}</span>
                {total === 0 && (
                  <span className="text-xs text-gray-400">(noch keine Daten)</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${total > 0 ? rate : 0}%`, 
                      backgroundColor: info.color 
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-600 w-14 text-right">
                  {total > 0 ? `${rate.toFixed(0)}%` : '–'}
                </span>
              </div>
            </div>
          );
        })}
        
        <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
          Basierend auf {successRates.reduce((sum, s) => sum + s.total, 0)} Fragen insgesamt
        </div>
      </div>
      )}

      {section === 'levels' && (
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📊</span> Schwierigkeitsverlauf
        </h2>
        <p className="text-sm text-gray-500 mb-4">Wie hat sich dein Level entwickelt?</p>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4">
          {exerciseInfo.map(info => (
            <div key={info.type} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: info.color }}
              />
              <span className="text-sm text-gray-600">{info.emoji} {info.name}</span>
            </div>
          ))}
        </div>
        
        <MultiLineChart data={difficultyHistory} height={180} />
        
        {/* Current Levels */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Aktuelle Stufen</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {exerciseInfo.map(info => {
              const level = progress.difficulty[info.type].level;
              return (
                <div 
                  key={info.type}
                  className="rounded-lg p-3 text-center"
                  style={{ backgroundColor: `${info.color}15` }}
                >
                  <div className="text-xl mb-1">{info.emoji}</div>
                  <div className="text-lg font-bold" style={{ color: info.color }}>
                    Stufe {level}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getDifficultyLabel(level)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {(section === 'overview' || section === 'exercises') && (
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🏆</span> Bestleistungen
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {exerciseInfo.map(info => {
            const stats = progress.exerciseStats[info.type];
            return (
              <div 
                key={info.type}
                className="rounded-xl p-4 text-center"
                style={{ backgroundColor: `${info.color}10` }}
              >
                <div className="text-2xl mb-2">{info.emoji}</div>
                <div className="text-xs text-gray-500 mb-1">{info.name}</div>
                <div className="text-xl font-bold" style={{ color: info.color }}>
                  {stats.bestScore}
                </div>
                <div className="text-xs text-gray-400">Bester Score</div>
                <div className="text-sm text-gray-500 mt-2">
                  {stats.played}x gespielt
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>Spiele regelmässig für bessere Statistiken! 📈</p>
      </div>
    </div>
  );
}

function IQTrendCard({ history }: { history: IQResult[] }) {
  if (history.length === 0) return null;
  
  const first = history[0];
  const last = history[history.length - 1];
  const diff = last.iq - first.iq;
  const W = 300, H = 80;
  
  const pts = history.map((r, i) => {
    const x = history.length === 1 ? W / 2 : 10 + (i / (history.length - 1)) * (W - 20);
    const y = H - 10 - ((r.iq - 70) / 75) * (H - 20);
    return [x, y];
  });

  const fmtDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 text-center mb-4">
        <div className="rounded-lg bg-blue-50 p-3">
          <div className="text-xs text-gray-500">Erster Test</div>
          <div className="text-2xl font-bold text-blue-700">{first.iq}</div>
        </div>
        <div className="rounded-lg bg-blue-50 p-3">
          <div className="text-xs text-gray-500">Letzter Test</div>
          <div className="text-2xl font-bold text-blue-700">{last.iq}</div>
        </div>
        <div className="rounded-lg bg-blue-50 p-3">
          <div className="text-xs text-gray-500">Entwicklung</div>
          <div className={`text-2xl font-bold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {diff > 0 ? '+' : ''}{diff}
          </div>
        </div>
      </div>

      {history.length > 1 && (
        <>
          <div className="text-center text-sm text-gray-600 mb-3">
            Dein IQ-Trend: <b>{history.map(r => r.iq).join(' → ')}</b>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full mb-4">
            <polyline 
              points={pts.map(p => p.join(',')).join(' ')} 
              fill="none" 
              stroke="#2563eb" 
              strokeWidth="2.5" 
            />
            {pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#1e3a8a" />
            ))}
          </svg>
        </>
      )}

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Letzte IQ-Test Ergebnisse</h3>
        <ul className="divide-y divide-gray-100 text-sm max-h-40 overflow-auto">
          {[...history].reverse().slice(0, 5).map(r => (
            <li key={r.id} className="flex justify-between py-2">
              <span className="text-gray-600">{fmtDate(r.date)}</span>
              <span className="text-gray-800">
                <b>IQ {r.iq}</b> · {r.correct}/{r.total} richtig
              </span>
            </li>
          ))}
        </ul>
      </div>

      {last.categoryScores && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Letztes Profil</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORY_ORDER.map(k => {
              const score = last.categoryScores[k];
              return (
                <div key={k} className="text-center p-2 rounded-lg bg-gray-50">
                  <div className="text-xs text-gray-500">{CATEGORY_INFO[k].short}</div>
                  <div className={`text-lg font-bold ${score >= 70 ? 'text-green-600' : score >= 40 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {score}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
