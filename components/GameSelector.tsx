import React from 'react';
import { GameMode } from '../types';
import { playSound } from '../utils/audio';

interface GameSelectorProps {
  onSelect: (mode: GameMode) => void;
}

export const GameSelector: React.FC<GameSelectorProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-dark-bg flex items-center justify-center p-6 relative overflow-hidden transition-colors">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-tet-red/10 dark:bg-tet-red/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-tet-gold/10 dark:bg-tet-gold/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-sm space-y-10 relative z-10 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="inline-block bg-gradient-to-br from-tet-red to-rose-600 rounded-3xl p-6 shadow-2xl shadow-red-200/50 dark:shadow-none mb-4 rotate-3 transform transition-transform hover:rotate-6">
            <span className="text-5xl drop-shadow-md">🌸</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">Sổ Điểm<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-tet-red to-orange-500">Vui Xuân</span></h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Ghi điểm sum vầy. Tết thêm gắn kết.</p>
        </div>

        <div className="space-y-5">
          <div onClick={() => { playSound('click'); onSelect('TIENLEN'); }} className="group relative bg-white dark:bg-dark-card rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-tet-red/20 transition-all cursor-pointer active:scale-95 hover:shadow-xl">
            <div className="absolute top-5 right-5 text-4xl opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-300">🃏</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Tiến Lên</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Xếp hạng Nhất, Nhì, Ba. Tính điểm thưởng phạt Heo vui vẻ.</p>
          </div>

          <div onClick={() => { playSound('click'); onSelect('XIDACH'); }} className="group relative bg-white dark:bg-dark-card rounded-3xl p-6 shadow-lg border-2 border-transparent hover:border-tet-red/20 transition-all cursor-pointer active:scale-95 hover:shadow-xl">
            <div className="absolute top-5 right-5 text-4xl opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-300">✨</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Xì Dách</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Chủ Xị & Các Thành Viên. Tự động tính điểm Xì Bàn/Xì Dách.</p>
            <div className="mt-3 flex gap-2">
               <span className="text-[10px] font-bold bg-tet-red/10 text-tet-red px-2 py-1 rounded-md">HOT</span>
               <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-2 py-1 rounded-md">Tự động tính</span>
            </div>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 font-medium">Family Edition</p>
      </div>
    </div>
  );
};