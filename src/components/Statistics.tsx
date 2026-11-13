import { useMemo } from 'react';
import type { UserProgress, ExerciseType } from '../types';
import { 
  getDailyPointsHistory, 
  getSuccessRatesByType, 
  getDifficultyHistory,
  getDifficultyLabel 
} from '../utils/storage';

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

export default function Statistics({ progress, onBack }: StatisticsProps) {
  const dailyPoints = useMemo(() => getDailyPointsHistory(14), []);
  const successRates = useMemo(() => getSuccessRatesByType(), []);
  const difficultyHistory = useMemo(() => getDifficultyHistory(14), []);
  
  const totalPointsLast14Days = dailyPoints.reduce((sum, d) => sum + d.points, 0);
  const avgPointsPerDay = totalPointsLast14Days / 14;
  const activeDays = dailyPoints.filter(d => d.points > 0).length;
  
  const chartData = dailyPoints.map(d => ({
    label: d.date,
    value: d.points,
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack} 
          className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          <span>←</span> Zurück
        </button>
        <h1 className="text-2xl font-bold text-gray-800">📊 Statistiken</h1>
        <div className="w-20" />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

      {/* Points History Chart */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📈</span> Punkte pro Tag
        </h2>
        <p className="text-sm text-gray-500 mb-4">Dein Punkteverlauf der letzten 14 Tage</p>
        <SimpleLineChart data={chartData} color="#6366F1" height={180} />
      </div>

      {/* Success Rates */}
      <div className="card mb-8">
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

      {/* Difficulty Progression */}
      <div className="card mb-8">
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

      {/* Exercise Details */}
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

      {/* Footer */}
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>Spiele regelmässig für bessere Statistiken! 📈</p>
      </div>
    </div>
  );
}
