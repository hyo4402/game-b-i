import React, { useState, useEffect } from 'react';
import { Player, GameState, DEFAULT_TIENLEN_RULES, RoundHistory, TienLenRules } from '../types';
import { Scoreboard } from './Scoreboard';
import { Button } from './Button';
import { Layout } from './Layout';
import { PlayerManager } from './PlayerManager';
import { Undo2, History, X, Settings, Save, Users } from 'lucide-react';
import { playSound, triggerConfetti } from '../utils/audio';
import { safeGet, safeSet } from '../utils/storage';

interface TienLenGameProps {
  initialPlayers: Player[];
  onBack: () => void;
}

export const TienLenGame: React.FC<TienLenGameProps> = ({ initialPlayers, onBack }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = safeGet<GameState | null>('tienlen_state', null);
    if (saved) {
      if (!saved.tienLenRules) saved.tienLenRules = DEFAULT_TIENLEN_RULES;
      if (!saved.players) saved.players = initialPlayers;
      if (!saved.history) saved.history = [];
      return saved;
    }
    return { players: initialPlayers, history: [], tienLenRules: DEFAULT_TIENLEN_RULES };
  });

  const [inputMode, setInputMode] = useState<'NONE' | 'RANKING' | 'PIG' | 'SETTINGS' | 'PLAYERS'>('NONE');
  const [selectedRanks, setSelectedRanks] = useState<string[]>([]);
  const [pigCutter, setPigCutter] = useState<string | null>(null);
  const [pigVictim, setPigVictim] = useState<string | null>(null);
  const [editingRules, setEditingRules] = useState<TienLenRules>(DEFAULT_TIENLEN_RULES);

  useEffect(() => { 
      safeSet('tienlen_state', gameState);
  }, [gameState]);

  const rules = gameState.tienLenRules || DEFAULT_TIENLEN_RULES;

  const updateScores = (changes: Record<string, number>, description: string) => {
    const newPlayers = gameState.players.map(p => ({ ...p, score: p.score + (changes[p.id] || 0) }));
    const newRound: RoundHistory = { id: Date.now().toString(), timestamp: Date.now(), description, scoreChanges: changes };
    setGameState({ ...gameState, players: newPlayers, history: [newRound, ...gameState.history] });
  };

  const handleAddPlayer = (name: string) => {
    const newPlayer: Player = { id: Date.now().toString(), name, score: 0 };
    setGameState(prev => ({
        ...prev,
        players: [...prev.players, newPlayer]
    }));
  };

  const handleRemovePlayer = (id: string) => {
    setGameState(prev => ({
        ...prev,
        players: prev.players.filter(p => p.id !== id)
    }));
  };

  const handleRankSelection = (playerId: string) => {
    playSound('click');
    if (selectedRanks.includes(playerId)) setSelectedRanks(selectedRanks.filter(id => id !== playerId));
    else setSelectedRanks([...selectedRanks, playerId]);
  };

  const submitRanking = () => {
    const changes: Record<string, number> = {};
    const count = selectedRanks.length;
    if (count < 2) return;
    changes[selectedRanks[0]] = rules.FIRST;
    changes[selectedRanks[count - 1]] = rules.LAST;
    if (count >= 4) { changes[selectedRanks[1]] = rules.SECOND; changes[selectedRanks[2]] = rules.THIRD; } 
    else if (count === 3) { changes[selectedRanks[1]] = 0; } 

    updateScores(changes, 'Xếp hạng');
    setInputMode('NONE');
    setSelectedRanks([]);
    triggerConfetti();
    playSound('win');
  };

  const submitPig = (type: 'BLACK' | 'RED') => {
    if (!pigCutter || !pigVictim) return;
    const points = type === 'BLACK' ? rules.PIG_BLACK : rules.PIG_RED;
    const changes: Record<string, number> = {};
    changes[pigCutter] = points;
    changes[pigVictim] = -points;
    updateScores(changes, `Phạt ${type === 'BLACK' ? 'Heo Đen' : 'Heo Đỏ'}`);
    playSound('coin');
  };

  const saveSettings = () => { setGameState({ ...gameState, tienLenRules: editingRules }); setInputMode('NONE'); playSound('click'); };
  const undoLast = () => { if (gameState.history.length === 0) return; const lastRound = gameState.history[0]; const newPlayers = gameState.players.map(p => ({ ...p, score: p.score - (lastRound.scoreChanges[p.id] || 0) })); setGameState({ ...gameState, players: newPlayers, history: gameState.history.slice(1) }); playSound('click'); };
  const resetGame = () => { setGameState({ ...gameState, players: gameState.players.map(p => ({ ...p, score: 0 })), history: [] }); };

  return (
    <Layout title="Tiến Lên" onBack={onBack} onReset={resetGame}>
      <Scoreboard players={gameState.players} />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button onClick={() => setInputMode('RANKING')} className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-tet-red to-rose-600 border-0 shadow-lg shadow-red-200 dark:shadow-none">
           <span className="text-3xl">🏆</span><span className="text-white font-bold">Xếp Hạng</span>
        </Button>
        <div className="flex flex-col gap-3">
          <Button variant="secondary" onClick={() => setInputMode('PIG')} className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-dark-card text-gray-800 dark:text-white border-2 border-gray-100 dark:border-gray-700 hover:border-tet-gold shadow-sm">
            <span className="text-2xl">🐷</span><span className="font-bold">Heo & Hàng</span>
          </Button>
          <div className="grid grid-cols-2 gap-2 h-10">
             <Button variant="outline" onClick={() => setInputMode('PLAYERS')} className="flex items-center justify-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-none">
                 <Users className="w-3 h-3" /> Thành viên
             </Button>
             <Button variant="outline" onClick={() => { setEditingRules(rules); setInputMode('SETTINGS'); }} className="flex items-center justify-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-none">
                 <Settings className="w-3 h-3" /> Luật
             </Button>
          </div>
        </div>
      </div>
      <div className="space-y-4">
         <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase flex items-center gap-2"><History className="w-4 h-4" /> Lịch sử</h3>
            <button onClick={undoLast} disabled={gameState.history.length === 0} className="text-sm text-blue-600 dark:text-blue-400 font-medium disabled:opacity-30 flex items-center gap-1"><Undo2 className="w-4 h-4" /> Hoàn tác</button>
         </div>
         <div className="space-y-2">
            {gameState.history.map(round => (
              <div key={round.id} className="bg-white dark:bg-dark-card p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-sm">
                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <span>{new Date(round.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{round.description}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {Object.entries(round.scoreChanges).map(([pid, value]) => {
                    const score = value as number; if (score === 0) return null;
                    const pName = gameState.players.find(p => p.id === pid)?.name;
                    return <span key={pid} className={`${score > 0 ? 'text-tet-win' : 'text-tet-lose'} font-medium`}>{pName}: {score > 0 ? '+' : ''}{score}</span>;
                  })}
                </div>
              </div>
            ))}
            {gameState.history.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">Chưa có ván nào.</div>}
         </div>
      </div>
      {/* Ranking Modal */}
      {inputMode === 'RANKING' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kết quả</h2>
              <button onClick={() => { setInputMode('NONE'); setSelectedRanks([]); }} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X className="w-5 h-5 dark:text-white" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {gameState.players.map(p => {
                const rankIndex = selectedRanks.indexOf(p.id); const isSelected = rankIndex !== -1;
                return (
                  <button key={p.id} onClick={() => handleRankSelection(p.id)} className={`p-4 rounded-xl font-semibold text-left relative transition-all ${isSelected ? 'bg-tet-gold text-white' : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent text-gray-700 dark:text-gray-300'}`}>
                    {p.name} {isSelected && <div className="absolute top-2 right-2 bg-white text-yellow-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">{rankIndex + 1}</div>}
                  </button>
                );
              })}
            </div>
            <Button fullWidth onClick={submitRanking} disabled={selectedRanks.length < 2}>Lưu kết quả</Button>
          </div>
        </div>
      )}
      
      {/* Pig Modal */}
       {inputMode === 'PIG' && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md">
              <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up border border-gray-200 dark:border-gray-700">
                 <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Thưởng/Phạt Heo</h2>
                  <button onClick={() => { setInputMode('NONE'); setPigCutter(null); setPigVictim(null); }} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X className="w-5 h-5 dark:text-white" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                   <div className="space-y-2">
                      <div className="text-xs font-bold text-green-500 uppercase">Người Thưởng</div>
                      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {gameState.players.map(p => <button key={p.id} onClick={() => setPigCutter(p.id)} disabled={pigVictim === p.id} className={`w-full p-3 rounded-xl text-sm font-bold border-2 ${pigCutter === p.id ? 'border-green-500 bg-green-500 text-white' : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-500'}`}>{p.name}</button>)}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="text-xs font-bold text-red-500 uppercase">Người Bị Phạt</div>
                      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {gameState.players.map(p => <button key={p.id} onClick={() => setPigVictim(p.id)} disabled={pigCutter === p.id} className={`w-full p-3 rounded-xl text-sm font-bold border-2 ${pigVictim === p.id ? 'border-red-500 bg-red-500 text-white' : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-500'}`}>{p.name}</button>)}
                      </div>
                   </div>
                </div>
                 <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => submitPig('BLACK')} disabled={!pigCutter || !pigVictim} className="bg-gray-800 text-white">Heo Đen (+{rules.PIG_BLACK})</Button>
                  <Button onClick={() => submitPig('RED')} disabled={!pigCutter || !pigVictim} variant="primary">Heo Đỏ (+{rules.PIG_RED})</Button>
                </div>
              </div>
            </div>
      )}

      {/* Settings Modal */}
      {inputMode === 'SETTINGS' && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md">
              <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white"><Settings className="w-5 h-5" /> Cài Đặt Điểm</h2>
                  <button onClick={() => setInputMode('NONE')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X className="w-5 h-5 dark:text-white" /></button>
                </div>

                <div className="space-y-6 mb-8">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                    <h3 className="font-bold text-xs text-gray-400 uppercase mb-4 tracking-wider">Điểm Xếp Hạng</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500">Nhất (Cộng)</label>
                        <input type="number" value={editingRules.FIRST} onChange={e => setEditingRules({...editingRules, FIRST: Number(e.target.value)})} className="w-full mt-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg font-mono font-bold text-green-600 dark:bg-gray-800" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Nhì (Cộng)</label>
                        <input type="number" value={editingRules.SECOND} onChange={e => setEditingRules({...editingRules, SECOND: Number(e.target.value)})} className="w-full mt-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg font-mono font-bold text-blue-600 dark:bg-gray-800" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Ba (Trừ)</label>
                        <input type="number" value={Math.abs(editingRules.THIRD)} onChange={e => setEditingRules({...editingRules, THIRD: -Math.abs(Number(e.target.value))})} className="w-full mt-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg font-mono font-bold text-orange-600 dark:bg-gray-800" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Chót (Trừ)</label>
                        <input type="number" value={Math.abs(editingRules.LAST)} onChange={e => setEditingRules({...editingRules, LAST: -Math.abs(Number(e.target.value))})} className="w-full mt-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg font-mono font-bold text-red-600 dark:bg-gray-800" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                    <h3 className="font-bold text-xs text-gray-400 uppercase mb-4 tracking-wider">Điểm Phạt</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500">Heo Đen</label>
                        <input type="number" value={editingRules.PIG_BLACK} onChange={e => setEditingRules({...editingRules, PIG_BLACK: Number(e.target.value)})} className="w-full mt-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg font-mono font-bold text-gray-800 dark:text-gray-200 dark:bg-gray-800" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500">Heo Đỏ</label>
                        <input type="number" value={editingRules.PIG_RED} onChange={e => setEditingRules({...editingRules, PIG_RED: Number(e.target.value)})} className="w-full mt-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg font-mono font-bold text-tet-red dark:bg-gray-800" />
                      </div>
                    </div>
                  </div>
                </div>

                <Button fullWidth onClick={saveSettings}>
                   <Save className="w-4 h-4 mr-2" /> Lưu Thay Đổi
                </Button>
              </div>
            </div>
      )}

      {inputMode === 'PLAYERS' && (
          <PlayerManager 
              players={gameState.players}
              onAdd={handleAddPlayer}
              onRemove={handleRemovePlayer}
              onClose={() => setInputMode('NONE')}
          />
      )}
    </Layout>
  );
};