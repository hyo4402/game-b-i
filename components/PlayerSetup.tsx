import React, { useState } from 'react';
import { Player } from '../types';
import { Button } from './Button';
import { User, Plus, X, Crown } from 'lucide-react';
import { playSound } from '../utils/audio';

interface PlayerSetupProps {
  onStart: (players: Player[], dealerId?: string) => void;
  gameMode: 'TIENLEN' | 'XIDACH';
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStart, gameMode }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState('');
  const [dealerId, setDealerId] = useState('');

  const addPlayer = () => {
    if (!newName.trim()) return;
    const newPlayer = { id: Date.now().toString(), name: newName.trim(), score: 0 };
    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    if (gameMode === 'XIDACH' && players.length === 0) setDealerId(newPlayer.id);
    setNewName('');
    playSound('click');
  };

  const removePlayer = (id: string) => {
    const updatedPlayers = players.filter(p => p.id !== id);
    setPlayers(updatedPlayers);
    if (gameMode === 'XIDACH' && dealerId === id && updatedPlayers.length > 0) setDealerId(updatedPlayers[0].id);
    playSound('click');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-card p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in transition-colors">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Thành viên tham gia</h2>
        <div className="flex gap-2 mb-6">
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPlayer()} placeholder="Nhập tên..." className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-tet-red focus:ring-1 focus:ring-tet-red transition-all dark:text-white" />
          <Button onClick={addPlayer} disabled={!newName.trim()} className="w-12 h-12 !p-0"><Plus className="w-6 h-6" /></Button>
        </div>
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          {players.length === 0 && <div className="text-center py-8 text-gray-400 text-sm italic border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">Chưa có ai. Thêm tên để bắt đầu!</div>}
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-xl animate-fade-in border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-3">
                {gameMode === 'XIDACH' && (
                   <div onClick={() => { setDealerId(p.id); playSound('click'); }} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${dealerId === p.id ? 'border-tet-red bg-tet-red text-white shadow-md transform scale-110' : 'border-gray-300 text-gray-300 dark:border-gray-600 dark:text-gray-600'}`} title="Chọn làm Chủ Xị">
                     <Crown className="w-4 h-4" />
                   </div>
                )}
                <span className={`font-semibold ${dealerId === p.id && gameMode === 'XIDACH' ? 'text-tet-red' : 'text-gray-700 dark:text-gray-200'}`}>{p.name}</span>
              </div>
              <button onClick={() => removePlayer(p.id)} className="text-gray-300 hover:text-red-500 p-2"><X className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
        {gameMode === 'XIDACH' && players.length > 0 && <p className="text-xs text-center text-gray-400 mt-2">Bấm vào vương miện <Crown className="w-3 h-3 inline"/> để chọn Chủ Xị</p>}
      </div>
      <div className="sticky bottom-4">
        <Button fullWidth onClick={() => { if (gameMode === 'XIDACH') onStart(players, dealerId); else onStart(players); }} disabled={players.length < 2} className="h-14 text-lg shadow-floating">
          Bắt đầu ({players.length})
        </Button>
      </div>
    </div>
  );
};