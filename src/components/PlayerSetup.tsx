import React, { useState } from 'react';
import { Player } from '../types';
import { Button } from './Button';
import { User, Plus, X, Crown } from 'lucide-react';
import { playSound } from '../utils/audio';

interface Props { onStart: (players: Player[], dealerId?: string) => void; gameMode: 'TIENLEN' | 'XIDACH'; }

export const PlayerSetup: React.FC<Props> = ({ onStart, gameMode }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [dealerId, setDealerId] = useState('');

  const add = () => {
    if (!name.trim()) return;
    const newP = { id: Date.now().toString(), name: name.trim(), score: 0 };
    setPlayers([...players, newP]);
    if (gameMode === 'XIDACH' && players.length === 0) setDealerId(newP.id);
    setName('');
    playSound('click');
  };

  const remove = (id: string) => {
    const updated = players.filter(p => p.id !== id);
    setPlayers(updated);
    if (gameMode === 'XIDACH' && dealerId === id && updated.length > 0) setDealerId(updated[0].id);
    playSound('click');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-card p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Thành viên tham gia</h2>
        <div className="flex gap-2 mb-6">
          <input type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Nhập tên..." className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none dark:text-white" />
          <Button onClick={add} disabled={!name.trim()} className="w-12 h-12 !p-0"><Plus className="w-6 h-6" /></Button>
        </div>
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {players.length === 0 && <div className="text-center py-8 text-gray-400 italic">Thêm tên để bắt đầu!</div>}
          {players.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-transparent hover:border-gray-200">
              <div className="flex items-center gap-3">
                {gameMode === 'XIDACH' && <div onClick={() => setDealerId(p.id)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer ${dealerId === p.id ? 'border-tet-red bg-tet-red text-white' : 'border-gray-300'}`}><Crown className="w-4 h-4" /></div>}
                <span className={`font-semibold ${dealerId === p.id && gameMode === 'XIDACH' ? 'text-tet-red' : 'text-gray-700 dark:text-gray-200'}`}>{p.name}</span>
              </div>
              <button onClick={() => remove(p.id)} className="text-gray-300 hover:text-red-500 p-2"><X className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="sticky bottom-4">
        <Button fullWidth onClick={() => onStart(players, dealerId)} disabled={players.length < 2} className="h-14 text-lg shadow-floating">Bắt đầu ({players.length})</Button>
      </div>
    </div>
  );
};