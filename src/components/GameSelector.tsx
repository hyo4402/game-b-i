import React from 'react';
import { GameMode } from '../types';
import { playSound } from '../utils/audio';

interface Props { onSelect: (mode: GameMode) => void; }

export const GameSelector: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-dark-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-tet-red/10 rounded-full blur-3xl"></div>
      <div className="w-full max-w-sm space-y-10 relative z-10 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="inline-block bg-gradient-to-br from-tet-red to-rose-600 rounded-3xl p-6 shadow-2xl mb-4"><span className="text-5xl">🌸</span></div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">Sổ Điểm<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-tet-red to-orange-500">Vui Xuân</span></h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Ghi điểm sum vầy. Tết thêm gắn kết.</p>
        </div>
        <div className="space-y-5">
          <div onClick={() => { playSound('click'); onSelect('TIENLEN'); }} className="group relative bg-white dark:bg-dark-card rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-tet-red/20 transition-all cursor-pointer active:scale-95">
            <div className="absolute top-5 right-5 text-4xl opacity-10">🃏</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Tiến Lên</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Xếp hạng Nhất, Nhì, Ba. Tính điểm thưởng phạt Heo vui vẻ.</p>
          </div>
          <div onClick={() => { playSound('click'); onSelect('XIDACH'); }} className="group relative bg-white dark:bg-dark-card rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-tet-red/20 transition-all cursor-pointer active:scale-95">
            <div className="absolute top-5 right-5 text-4xl opacity-10">✨</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Xì Dách</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Chủ Xị & Tay Con. Tự động tính điểm Xì Bàn/Xì Dách.</p>
          </div>
        </div>
      </div>
    </div>
  );
};