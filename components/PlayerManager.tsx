import React, { useState } from 'react';
import { X, Plus, Trash2, User, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Player } from '../types';
import { playSound, vibrate } from '../utils/audio';

interface PlayerManagerProps {
  players: Player[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  dealerId?: string; // Optional: To prevent removing the dealer in Xi Dach
}

export const PlayerManager: React.FC<PlayerManagerProps> = ({ players, onAdd, onRemove, onClose, dealerId }) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName('');
    playSound('click');
    vibrate();
  };

  const handleRemove = (id: string) => {
    if (dealerId && id === dealerId) {
      setError('Đang làm Chủ Xị, không thể rời bàn!');
      vibrate([50, 50, 50]);
      setTimeout(() => setError(null), 3000);
      return;
    }
    onRemove(id);
    playSound('click');
    vibrate();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-zoom-in border border-gray-100 dark:border-gray-700 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" /> Quản lý thành viên
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2 animate-bounce-subtle">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="flex gap-2 mb-4 shrink-0">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Tên người mới..."
            className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-tet-red focus:ring-1 focus:ring-tet-red transition-all dark:text-white"
          />
          <Button onClick={handleAdd} disabled={!newName.trim()} className="w-12 !px-0">
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors group">
              <span className={`font-semibold ${dealerId === p.id ? 'text-tet-red font-bold' : 'text-gray-700 dark:text-gray-200'}`}>
                {p.name} {dealerId === p.id && '(Chủ Xị)'}
              </span>
              <button
                onClick={() => handleRemove(p.id)}
                className={`p-2 rounded-lg transition-colors ${dealerId === p.id ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                disabled={dealerId === p.id}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <Button fullWidth variant="ghost" onClick={onClose} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">Đóng</Button>
        </div>
      </div>
    </div>
  );
};