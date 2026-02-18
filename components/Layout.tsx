import React, { useState, useEffect } from 'react';
import { ChevronLeft, RotateCcw, LogOut, Sun, Moon, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { playSound, vibrate } from '../utils/audio';

interface LayoutProps {
  title: string;
  onBack?: () => void;
  onReset?: () => void;
  onEndSession?: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ title, onBack, onReset, onEndSession, children }) => {
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; type: 'RESET' | 'END' | null }>({ isOpen: false, type: null });
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('sound_enabled') !== 'false');

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('sound_enabled', String(soundOn));
  }, [soundOn]);

  const handleConfirm = () => {
    if (confirmState.type === 'RESET' && onReset) onReset();
    if (confirmState.type === 'END' && onEndSession) onEndSession();
    setConfirmState({ isOpen: false, type: null });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-dark-bg max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-100 dark:border-gray-800 transition-colors">
      <header className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm h-14 transition-colors">
        <div className="flex items-center gap-1 overflow-hidden">
          {onBack && (
            <button onClick={() => { playSound('click'); onBack(); }} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors shrink-0 text-gray-600 dark:text-gray-300">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-lg font-bold text-gray-800 dark:text-white truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-1 shrink-0">
           <button onClick={() => { setSoundOn(!soundOn); vibrate(); }} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
           </button>
           <button onClick={() => { setIsDark(!isDark); vibrate(); }} className="p-2 text-gray-400 hover:text-tet-gold dark:text-yellow-400">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
           </button>
          {onReset && (
            <button onClick={() => { setConfirmState({ isOpen: true, type: 'RESET' }); playSound('click'); }} className="p-2 text-gray-400 hover:text-tet-gold dark:hover:text-tet-gold rounded-full transition-colors">
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
          {onEndSession && (
            <button onClick={() => { setConfirmState({ isOpen: true, type: 'END' }); playSound('click'); }} className="p-2 -mr-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 pb-28 no-scrollbar">
        {children}
      </main>

      {confirmState.isOpen && (
         <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-zoom-in border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{confirmState.type === 'RESET' ? "Chơi lại từ đầu?" : "Kết thúc?"}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {confirmState.type === 'RESET' ? "Điểm sẽ về 0. Tên người chơi giữ nguyên." : "Xóa toàn bộ dữ liệu bàn chơi."}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setConfirmState({ isOpen: false, type: null })} className="flex-1 bg-gray-100 dark:bg-gray-800">Hủy</Button>
              <Button variant="primary" onClick={handleConfirm} className="flex-1">Đồng ý</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};