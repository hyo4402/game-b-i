import React from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';

interface LayoutProps {
  title: string;
  onBack?: () => void;
  onReset?: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ title, onBack, onReset, children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        </div>
        {onReset && (
          <button 
            onClick={() => {
              if(window.confirm('Bạn có chắc muốn xóa hết điểm và lịch sử chơi không?')) onReset();
            }} 
            className="p-2 -mr-2 text-gray-400 hover:text-red-500 rounded-full"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </header>
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {children}
      </main>
    </div>
  );
};