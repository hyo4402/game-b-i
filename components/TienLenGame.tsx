import React, { useState, useEffect } from 'react';
import { Player, GameState, DEFAULT_TIENLEN_RULES, RoundHistory, TienLenRules } from '../types';
import { Scoreboard } from './Scoreboard';
import { Button } from './Button';
import { Layout } from './Layout';
import { Undo2, History, X, Zap, Settings, Save } from 'lucide-react';

interface TienLenGameProps {
  initialPlayers: Player[];
  onBack: () => void;
}

export const TienLenGame: React.FC<TienLenGameProps> = ({ initialPlayers, onBack }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('tienlen_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure rules exist for older saves
      if (!parsed.tienLenRules) parsed.tienLenRules = DEFAULT_TIENLEN_RULES;
      return parsed;
    }
    return { players: initialPlayers, history: [], tienLenRules: DEFAULT_TIENLEN_RULES };
  });

  const [inputMode, setInputMode] = useState<'NONE' | 'RANKING' | 'PIG' | 'SETTINGS'>('NONE');
  // For ranking input
  const [selectedRanks, setSelectedRanks] = useState<string[]>([]); // Array of player IDs in order: 1st, 2nd, 3rd...
  
  // For Pig input
  const [pigCutter, setPigCutter] = useState<string | null>(null);
  const [pigVictim, setPigVictim] = useState<string | null>(null);

  // Settings editing state
  const [editingRules, setEditingRules] = useState<TienLenRules>(DEFAULT_TIENLEN_RULES);

  useEffect(() => {
    localStorage.setItem('tienlen_state', JSON.stringify(gameState));
  }, [gameState]);

  const rules = gameState.tienLenRules || DEFAULT_TIENLEN_RULES;

  const updateScores = (changes: Record<string, number>, description: string) => {
    const newPlayers = gameState.players.map(p => ({
      ...p,
      score: p.score + (changes[p.id] || 0)
    }));

    const newRound: RoundHistory = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      description,
      scoreChanges: changes
    };

    setGameState({
      ...gameState,
      players: newPlayers,
      history: [newRound, ...gameState.history]
    });
  };

  const handleRankSelection = (playerId: string) => {
    if (selectedRanks.includes(playerId)) {
      setSelectedRanks(selectedRanks.filter(id => id !== playerId));
    } else {
      setSelectedRanks([...selectedRanks, playerId]);
    }
  };

  const submitRanking = () => {
    const changes: Record<string, number> = {};
    const count = selectedRanks.length;
    
    if (count < 2) return;

    // 1st Place
    changes[selectedRanks[0]] = rules.FIRST;

    // Last Place
    changes[selectedRanks[count - 1]] = rules.LAST;

    // Middle logic
    if (count >= 4) {
      // Standard 4 player
      changes[selectedRanks[1]] = rules.SECOND;
      changes[selectedRanks[2]] = rules.THIRD;
    } else if (count === 3) {
      // 3 Player: 2nd place gets 0
      changes[selectedRanks[1]] = 0;
    } 
    // 2 Players handled by first/last logic

    updateScores(changes, 'Xếp hạng');
    setInputMode('NONE');
    setSelectedRanks([]);
  };

  const submitPig = (type: 'BLACK' | 'RED') => {
    if (!pigCutter || !pigVictim) return;
    
    const points = type === 'BLACK' ? rules.PIG_BLACK : rules.PIG_RED;
    const typeName = type === 'BLACK' ? 'Heo Đen' : 'Heo Đỏ';
    const changes: Record<string, number> = {};
    
    changes[pigCutter] = points;
    changes[pigVictim] = -points;

    updateScores(changes, `Chặt ${typeName}`);
  };

  const saveSettings = () => {
    setGameState({
      ...gameState,
      tienLenRules: editingRules
    });
    setInputMode('NONE');
  };

  const undoLast = () => {
    if (gameState.history.length === 0) return;
    const lastRound = gameState.history[0];
    const newPlayers = gameState.players.map(p => ({
      ...p,
      score: p.score - (lastRound.scoreChanges[p.id] || 0)
    }));

    setGameState({
      ...gameState,
      players: newPlayers,
      history: gameState.history.slice(1)
    });
  };

  const resetGame = () => {
    setGameState({
      ...gameState,
      players: gameState.players.map(p => ({ ...p, score: 0 })),
      history: []
    });
  };

  return (
    <Layout title="Tiến Lên" onBack={onBack} onReset={resetGame}>
      <Scoreboard players={gameState.players} />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button onClick={() => setInputMode('RANKING')} className="h-24 flex flex-col items-center justify-center gap-2">
          <span className="text-2xl">🏆</span>
          <span>Xếp Hạng</span>
        </Button>
        <div className="flex flex-col gap-3">
          <Button variant="secondary" onClick={() => setInputMode('PIG')} className="flex-1 flex items-center justify-center gap-2">
            <span className="text-xl">🐷</span>
            <span>Chặt Heo</span>
          </Button>
          <Button variant="outline" onClick={() => {
            setEditingRules(rules);
            setInputMode('SETTINGS');
          }} className="h-12 flex items-center justify-center gap-2 text-sm">
            <Settings className="w-4 h-4" /> Luật Chơi
          </Button>
        </div>
      </div>

      <div className="space-y-4">
         <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-gray-500 text-sm uppercase flex items-center gap-2">
              <History className="w-4 h-4" /> Lịch sử
            </h3>
            <button 
              onClick={undoLast} 
              disabled={gameState.history.length === 0}
              className="text-sm text-blue-600 font-medium disabled:opacity-30 flex items-center gap-1"
            >
              <Undo2 className="w-4 h-4" /> Hoàn tác
            </button>
         </div>
         <div className="space-y-2">
            {gameState.history.map(round => (
              <div key={round.id} className="bg-white p-3 rounded-xl border border-gray-100 text-sm">
                <div className="flex justify-between text-gray-500 text-xs mb-1">
                  <span>{new Date(round.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span className="font-medium">{round.description}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {Object.entries(round.scoreChanges).map(([pid, value]) => {
                    const score = value as number;
                    if (score === 0) return null;
                    const pName = gameState.players.find(p => p.id === pid)?.name;
                    return (
                      <span key={pid} className={`${score > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                        {pName}: {score > 0 ? '+' : ''}{score}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
            {gameState.history.length === 0 && (
               <div className="text-center py-8 text-gray-400 text-sm">Chưa có ván nào.</div>
            )}
         </div>
      </div>

      {/* Ranking Modal Overlay */}
      {inputMode === 'RANKING' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Kết quả ván đấu</h2>
              <button onClick={() => { setInputMode('NONE'); setSelectedRanks([]); }} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-500 mb-2">Chọn người chơi theo thứ tự về Nhất, Nhì...</p>
              <div className="grid grid-cols-2 gap-3">
                {gameState.players.map(p => {
                  const rankIndex = selectedRanks.indexOf(p.id);
                  const isSelected = rankIndex !== -1;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleRankSelection(p.id)}
                      className={`p-4 rounded-xl font-semibold text-left relative transition-all ${isSelected ? 'bg-tet-gold/20 border-2 border-tet-gold text-yellow-900' : 'bg-gray-50 border-2 border-transparent text-gray-700'}`}
                    >
                      {p.name}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-tet-gold text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                          {rankIndex + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
               <Button variant="ghost" onClick={() => setSelectedRanks([])} className="flex-1">Xóa</Button>
               <Button onClick={submitRanking} className="flex-[2]" disabled={selectedRanks.length < 2}>
                 Lưu kết quả
               </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pig Modal Overlay */}
      {inputMode === 'PIG' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Tính Điểm Chặt Heo</h2>
              <button onClick={() => { setInputMode('NONE'); setPigCutter(null); setPigVictim(null); }} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-green-600 uppercase">Người Chặt (Ăn)</label>
                <div className="flex flex-col gap-2">
                  {gameState.players.map(p => (
                    <button
                      key={`winner-${p.id}`}
                      onClick={() => setPigCutter(p.id)}
                      disabled={pigVictim === p.id}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${pigCutter === p.id ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-gray-50 text-gray-600'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-red-600 uppercase">Người Bị Chặt (Thua)</label>
                <div className="flex flex-col gap-2">
                  {gameState.players.map(p => (
                    <button
                      key={`loser-${p.id}`}
                      onClick={() => setPigVictim(p.id)}
                      disabled={pigCutter === p.id}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${pigVictim === p.id ? 'bg-red-100 text-red-700 ring-2 ring-red-500' : 'bg-gray-50 text-gray-600'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => submitPig('BLACK')} 
                disabled={!pigCutter || !pigVictim}
                className="bg-gray-800 text-white shadow-gray-300"
              >
                +{rules.PIG_BLACK} Heo Đen
              </Button>
              <Button 
                onClick={() => submitPig('RED')} 
                disabled={!pigCutter || !pigVictim}
                variant="primary"
              >
                +{rules.PIG_RED} Heo Đỏ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {inputMode === 'SETTINGS' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-gray-600" /> Cài Đặt Luật</h2>
              <button onClick={() => setInputMode('NONE')} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6 mb-6">
              <div>
                <h3 className="font-bold text-sm text-gray-400 uppercase mb-3">Điểm Xếp Hạng</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Nhất</label>
                    <input 
                      type="number" 
                      value={editingRules.FIRST}
                      onChange={e => setEditingRules({...editingRules, FIRST: Number(e.target.value)})}
                      className="w-full mt-1 p-2 border rounded-lg font-mono text-green-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Nhì</label>
                    <input 
                      type="number" 
                      value={editingRules.SECOND}
                      onChange={e => setEditingRules({...editingRules, SECOND: Number(e.target.value)})}
                      className="w-full mt-1 p-2 border rounded-lg font-mono text-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Ba</label>
                    <input 
                      type="number" 
                      value={editingRules.THIRD}
                      onChange={e => setEditingRules({...editingRules, THIRD: Number(e.target.value)})}
                      className="w-full mt-1 p-2 border rounded-lg font-mono text-orange-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Chót</label>
                    <input 
                      type="number" 
                      value={editingRules.LAST}
                      onChange={e => setEditingRules({...editingRules, LAST: Number(e.target.value)})}
                      className="w-full mt-1 p-2 border rounded-lg font-mono text-red-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-gray-400 uppercase mb-3">Điểm Phạt</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Heo Đen</label>
                    <input 
                      type="number" 
                      value={editingRules.PIG_BLACK}
                      onChange={e => setEditingRules({...editingRules, PIG_BLACK: Number(e.target.value)})}
                      className="w-full mt-1 p-2 border rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Heo Đỏ</label>
                    <input 
                      type="number" 
                      value={editingRules.PIG_RED}
                      onChange={e => setEditingRules({...editingRules, PIG_RED: Number(e.target.value)})}
                      className="w-full mt-1 p-2 border rounded-lg font-mono text-tet-red"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button fullWidth onClick={saveSettings}>
               <Save className="w-5 h-5 mr-2 inline" /> Lưu Luật
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
};