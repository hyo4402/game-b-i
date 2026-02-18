import React, { useState } from 'react';
import { X, Plus, Trash2, User } from 'lucide-react';
import { Button } from './Button';
import { Player } from '../types';
import { playSound } from '../utils/audio';

interface Props { players: Player[]; onAdd: (name: string) => void; onRemove: (id: string) => void; onClose: () => void; dealerId?: string; }

export const PlayerManager: React.FC<Props> = ({ players, onAdd, onRemove, onClose, dealerId }) => {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-zoom-in border border-gray-100 dark:border-gray-700 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><User className="w-5 h-5" /> Quản lý thành viên</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex gap-2 mb-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && name.trim() && (onAdd(name.trim()), setName(''))} placeholder="Tên người mới..." className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none dark:text-white" />
          <Button onClick={() => { if(name.trim()) { onAdd(name.trim()); setName(''); } }} disabled={!name.trim()} className="w-12 !px-0"><Plus className="w-6 h-6" /></Button>
        </div>
        <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
          {players.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
              <span className={`font-semibold ${dealerId === p.id ? 'text-tet-red font-bold' : 'text-gray-700 dark:text-gray-200'}`}>{p.name} {dealerId === p.id && '(Chủ Xị)'}</span>
              <button onClick={() => p.id !== dealerId && onRemove(p.id)} className={`p-2 rounded-lg ${dealerId === p.id ? 'text-gray-300' : 'text-gray-400 hover:text-red-500'}`} disabled={dealerId === p.id}><Trash2 className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};