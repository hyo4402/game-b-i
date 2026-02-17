import React, { useState } from 'react';
import { Plus, X, User } from 'lucide-react';
import { Button } from './Button';
import { Player } from '../types';

interface PlayerSetupProps {
  onStart: (players: Player[], dealerId?: string) => void;
  gameMode: 'TIENLEN' | 'XIDACH';
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStart, gameMode }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState('');
  const [dealerId, setDealerId] = useState<string>('');

  const addPlayer = () => {
    if (!newName.trim()) return;
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newName.trim(),
      score: 0
    };
    
    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    
    // If this is the first player added in Xi Dach, make them default dealer
    if (gameMode === 'XIDACH' && players.length === 0) {
      setDealerId(newPlayer.id);
    }
    
    setNewName('');
  };

  const removePlayer = (id: string) => {
    const updatedPlayers = players.filter(p => p.id !== id);
    setPlayers(updatedPlayers);
    
    // Reassign dealer if dealer was removed
    if (gameMode === 'XIDACH' && dealerId === id && updatedPlayers.length > 0) {
      setDealerId(updatedPlayers[0].id);
    }
  };

  const handleStart = () => {
    if (gameMode === 'XIDACH') {
      onStart(players, dealerId);
    } else {
      onStart(players);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-tet-red" />
          Thêm Người Chơi
        </h2>
        
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            placeholder="Tên người chơi..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-tet-red focus:ring-1 focus:ring-tet-red"
          />
          <Button onClick={addPlayer} disabled={!newName.trim()}>
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        <div className="space-y-2">
          {players.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm italic">
              Chưa có người chơi nào. Hãy thêm tên ở trên.
            </div>
          )}
          
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-3">
                {gameMode === 'XIDACH' && (
                   <div 
                    onClick={() => setDealerId(p.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${dealerId === p.id ? 'border-tet-red bg-tet-red' : 'border-gray-300'}`}
                   >
                     {dealerId === p.id && <div className="w-2 h-2 bg-white rounded-full" />}
                   </div>
                )}
                <span className="font-medium">{p.name} {gameMode === 'XIDACH' && dealerId === p.id && <span className="text-xs text-tet-red font-bold">(Nhà Cái)</span>}</span>
              </div>
              <button onClick={() => removePlayer(p.id)} className="text-gray-400 hover:text-red-500 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-4">
        <Button fullWidth onClick={handleStart} disabled={players.length < 2}>
          Bắt đầu chơi ({players.length})
        </Button>
      </div>
    </div>
  );
};