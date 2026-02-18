import React, { useState } from 'react';
import { Player } from '../types';
import { Trophy, Wallet, X, Crown, Sparkles, HeartHandshake } from 'lucide-react';

interface Props { players: Player[]; dealerId?: string; }

export const Scoreboard: React.FC<Props> = ({ players, dealerId }) => {
  const [showSettlement, setShowSettlement] = useState(false);
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  return (
    <>
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
        <div className="bg-gray-50/50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1"><Trophy className="w-3 h-3" /> Bảng Vàng</span>
          <button onClick={() => setShowSettlement(true)} className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg flex items-center gap-1"><Wallet className="w-3 h-3" /> Tổng Kết</button>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {sorted.map((p, idx) => {
            const isTop = idx === 0 && p.score > 0;
            return (
              <div key={p.id} className={`flex justify-between px-4 py-3 ${isTop ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 text-center ${isTop ? 'text-xl' : 'text-sm font-bold text-gray-400'}`}>{isTop ? '🥇' : `#${idx + 1}`}</div>
                  <div className="flex items-center gap-1">
                    <span className={`font-semibold ${isTop ? 'text-yellow-900 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-200'}`}>{p.name}</span>
                    {dealerId === p.id && <Crown className="w-3 h-3 text-yellow-600 fill-yellow-600" />}
                  </div>
                </div>
                <span className={`font-mono font-bold text-lg ${p.score > 0 ? 'text-tet-win' : p.score < 0 ? 'text-tet-lose' : 'text-gray-400'}`}>{p.score > 0 ? '+' : ''}{p.score}</span>
              </div>
            );
          })}
        </div>
      </div>
      {showSettlement && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowSettlement(false)} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full"><X className="w-5 h-5 dark:text-white" /></button>
            <h2 className="text-2xl font-black text-center mb-1 dark:text-white">Tổng Kết</h2>
            <div className="space-y-6 mt-6 max-h-[60vh] overflow-y-auto">
              <div>
                <h3 className="text-xs font-bold text-green-600 uppercase mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Người Thắng</h3>
                <div className="space-y-2">{sorted.filter(p => p.score > 0).map(p => (<div key={p.id} className="flex justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-xl"><span className="font-bold text-gray-800 dark:text-green-100">{p.name}</span><span className="font-mono font-bold text-green-600">+{fmt(p.score)}</span></div>))}</div>
              </div>
              <div className="w-full h-px bg-gray-100 dark:bg-gray-700"></div>
              <div>
                <h3 className="text-xs font-bold text-red-600 uppercase mb-2 flex items-center gap-1"><HeartHandshake className="w-3 h-3" /> Người Thua</h3>
                <div className="space-y-2">{sorted.filter(p => p.score < 0).map(p => (<div key={p.id} className="flex justify-between bg-red-50 dark:bg-red-900/20 p-3 rounded-xl"><span className="font-bold text-gray-800 dark:text-red-100">{p.name}</span><span className="font-mono font-bold text-red-600">{fmt(p.score)}</span></div>))}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};