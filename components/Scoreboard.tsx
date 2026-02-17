import React from 'react';
import { Player } from '../types';
import { Trophy } from 'lucide-react';

interface ScoreboardProps {
  players: Player[];
  dealerId?: string;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ players, dealerId }) => {
  // Sort by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bảng Xếp Hạng</span>
        <Trophy className="w-4 h-4 text-tet-gold" />
      </div>
      <div className="divide-y divide-gray-100">
        {sortedPlayers.map((p, idx) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold w-6 ${idx === 0 ? 'text-tet-gold text-lg' : 'text-gray-400'}`}>
                #{idx + 1}
              </span>
              <div>
                <span className="font-semibold text-gray-900">{p.name}</span>
                {dealerId === p.id && <span className="ml-2 text-[10px] bg-gray-800 text-white px-1.5 py-0.5 rounded">CÁI</span>}
              </div>
            </div>
            <span className={`font-mono font-bold text-lg ${p.score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {p.score > 0 ? '+' : ''}{p.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};