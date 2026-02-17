import React from 'react';
import { GameMode } from '../types';

interface GameSelectorProps {
  onSelect: (mode: GameMode) => void;
}

export const GameSelector: React.FC<GameSelectorProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-tet-light flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-block bg-tet-red rounded-2xl p-4 shadow-xl mb-4 rotate-3">
            <span className="text-4xl">🧧</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Sổ Cái<br/><span className="text-tet-red">Ngày Tết</span></h1>
          <p className="text-gray-500">Ghi điểm bài bạc, vui xuân phát tài.</p>
        </div>

        <div className="space-y-4">
          <div 
            onClick={() => onSelect('TIENLEN')}
            className="group relative bg-white rounded-2xl p-6 shadow-sm border-2 border-transparent hover:border-tet-red transition-all cursor-pointer active:scale-95"
          >
            <div className="absolute top-4 right-4 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">♠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Tiến Lên</h3>
            <p className="text-sm text-gray-500">Chấm điểm Nhất, Nhì, Ba, Chót & Chặt Heo.</p>
          </div>

          <div 
            onClick={() => onSelect('XIDACH')}
            className="group relative bg-white rounded-2xl p-6 shadow-sm border-2 border-transparent hover:border-tet-red transition-all cursor-pointer active:scale-95"
          >
            <div className="absolute top-4 right-4 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">🃏</div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Xì Dách</h3>
            <p className="text-sm text-gray-500">Nhà cái vs Nhà con. Tính tiền cược nhanh.</p>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-8">
          Điểm được lưu tự động trên máy của bạn.
        </p>
      </div>
    </div>
  );
};