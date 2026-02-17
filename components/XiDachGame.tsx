import React, { useState, useEffect } from 'react';
import { Player, GameState, RoundHistory } from '../types';
import { Scoreboard } from './Scoreboard';
import { Button } from './Button';
import { Layout } from './Layout';
import { Undo2, History, X, Check, Minus, Zap, Copy } from 'lucide-react';

interface XiDachGameProps {
  initialPlayers: Player[];
  dealerId: string;
  onBack: () => void;
}

type ResultType = 'WIN' | 'LOSE' | 'DRAW';
type MultiplierType = 1 | 2 | 3;

export const XiDachGame: React.FC<XiDachGameProps> = ({ initialPlayers, dealerId, onBack }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('xidach_state');
    const parsed = saved ? JSON.parse(saved) : { players: initialPlayers, history: [], dealerId };
    
    // Initialize default bets if not present (empty object initially)
    if (!parsed.defaultBets) {
      parsed.defaultBets = {};
    }
    return parsed;
  });

  // State for the round modal
  const [bets, setBets] = useState<Record<string, string>>({}); 
  const [results, setResults] = useState<Record<string, ResultType>>({});
  const [multipliers, setMultipliers] = useState<Record<string, MultiplierType>>({});
  
  const [isRoundOpen, setIsRoundOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('xidach_state', JSON.stringify(gameState));
  }, [gameState]);

  // When round opens, pre-fill from defaults (Sticky Bets)
  useEffect(() => {
    if (isRoundOpen) {
       const initialBets: Record<string, string> = {};
       const initialResults: Record<string, ResultType> = {};
       const initialMultipliers: Record<string, MultiplierType> = {};
       
       gameState.players.forEach(p => {
         if (p.id !== dealerId) {
            // Load sticky bet for this player, default to 10 if never set
            initialBets[p.id] = (gameState.defaultBets?.[p.id] || 10).toString();
            initialResults[p.id] = 'LOSE'; // Default: Dealer wins
            initialMultipliers[p.id] = 1;
         }
       });
       setBets(initialBets);
       setResults(initialResults);
       setMultipliers(initialMultipliers);
    }
  }, [isRoundOpen, gameState.players, gameState.defaultBets, dealerId]);

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

    setGameState(prev => ({
      ...prev,
      players: newPlayers,
      history: [newRound, ...prev.history]
    }));
  };

  const submitRound = () => {
    const changes: Record<string, number> = {};
    const newDefaultBets = { ...(gameState.defaultBets || {}) };
    let dealerDelta = 0;

    gameState.players.forEach(p => {
      if (p.id === dealerId) return;

      const betAmount = parseInt(bets[p.id] || '0', 10);
      
      // Update sticky bet preference
      newDefaultBets[p.id] = betAmount;

      const result = results[p.id];
      const mult = multipliers[p.id] || 1;
      const finalAmount = betAmount * mult;

      if (betAmount > 0) {
        if (result === 'WIN') {
          changes[p.id] = finalAmount;
          dealerDelta -= finalAmount;
        } else if (result === 'LOSE') {
          changes[p.id] = -finalAmount;
          dealerDelta += finalAmount;
        }
        // Draw = 0 change
      }
    });

    changes[dealerId] = dealerDelta;

    // Save sticky bets to gameState
    setGameState(prev => ({
        ...prev,
        defaultBets: newDefaultBets
    }));

    updateScores(changes, 'Kết quả ván');
    setIsRoundOpen(false);
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

  const toggleMultiplier = (pid: string, val: MultiplierType) => {
    setMultipliers(prev => ({...prev, [pid]: prev[pid] === val ? 1 : val}));
  }

  const setAllResults = (type: ResultType) => {
      const newResults: Record<string, ResultType> = {};
      gameState.players.forEach(p => {
          if (p.id !== dealerId) newResults[p.id] = type;
      });
      setResults(newResults);
  }

  const applyBetToAll = (amount: string) => {
      const newBets: Record<string, string> = {};
      gameState.players.forEach(p => {
          if (p.id !== dealerId) newBets[p.id] = amount;
      });
      setBets(newBets);
  }

  return (
    <Layout title="Xì Dách" onBack={onBack} onReset={resetGame}>
      <Scoreboard players={gameState.players} dealerId={dealerId} />

      {!isRoundOpen ? (
        <div className="mb-6 space-y-3">
          <Button fullWidth onClick={() => setIsRoundOpen(true)} className="h-16 text-lg shadow-xl animate-bounce-subtle">
            Bắt đầu ván mới
          </Button>
          <p className="text-center text-xs text-gray-400">
             Tiền cược sẽ tự động lưu lại cho ván sau.
          </p>
        </div>
      ) : (
         // Round Input Modal/View
        <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
           <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
              <h2 className="font-bold text-lg">Nhập kết quả</h2>
              <button onClick={() => setIsRoundOpen(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
           </div>

           {/* Quick Actions Toolbar */}
           <div className="bg-gray-100 px-4 py-2 flex gap-2 overflow-x-auto shrink-0 border-b">
               <button 
                 onClick={() => setAllResults('LOSE')}
                 className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold whitespace-nowrap"
               >
                 <Zap className="w-3 h-3" /> Cái ăn hết
               </button>
               <button 
                 onClick={() => setAllResults('DRAW')}
                 className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold whitespace-nowrap"
               >
                 Hòa hết
               </button>
               <div className="w-px h-6 bg-gray-300 mx-1"></div>
               <button 
                  onClick={() => {
                      const firstVal = Object.values(bets)[0];
                      if(typeof firstVal === 'string') applyBetToAll(firstVal);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-bold whitespace-nowrap"
               >
                  <Copy className="w-3 h-3" /> Copy tiền cược
               </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {gameState.players.filter(p => p.id !== dealerId).map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg truncate max-w-[150px]">{p.name}</span>
                    <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 focus-within:ring-2 focus-within:ring-tet-red/20 focus-within:border-tet-red transition-all">
                      <span className="text-gray-400 text-sm">$</span>
                      <input 
                        type="number" 
                        inputMode="numeric"
                        value={bets[p.id] || ''}
                        onChange={(e) => setBets({...bets, [p.id]: e.target.value})}
                        className="w-16 text-right font-mono font-bold bg-transparent outline-none text-gray-900"
                      />
                      <span className="text-gray-400 text-xs font-bold">k</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setResults({...results, [p.id]: 'LOSE'})}
                        className={`py-3 rounded-lg font-bold text-sm flex flex-col items-center gap-1 transition-all ${results[p.id] === 'LOSE' ? 'bg-red-500 text-white shadow-md shadow-red-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      >
                        <X className="w-5 h-5" /> Thua
                      </button>
                       <button
                        onClick={() => setResults({...results, [p.id]: 'DRAW'})}
                        className={`py-3 rounded-lg font-bold text-sm flex flex-col items-center gap-1 transition-all ${results[p.id] === 'DRAW' ? 'bg-yellow-400 text-yellow-900 shadow-md shadow-yellow-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      >
                        <Minus className="w-5 h-5" /> Hòa
                      </button>
                      <button
                        onClick={() => setResults({...results, [p.id]: 'WIN'})}
                        className={`py-3 rounded-lg font-bold text-sm flex flex-col items-center gap-1 transition-all ${results[p.id] === 'WIN' ? 'bg-green-500 text-white shadow-md shadow-green-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      >
                        <Check className="w-5 h-5" /> Thắng
                      </button>
                    </div>

                    {/* Multiplier Toggles - Only show if not Draw */}
                    {results[p.id] !== 'DRAW' && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                           <button 
                             onClick={() => toggleMultiplier(p.id, 2)}
                             className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${multipliers[p.id] === 2 ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-400 border-gray-200'}`}
                           >
                             x2 (Xì Dách)
                           </button>
                           <button 
                             onClick={() => toggleMultiplier(p.id, 3)}
                             className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${multipliers[p.id] === 3 ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-gray-400 border-gray-200'}`}
                           >
                             x3 (Xì Bàn)
                           </button>
                        </div>
                    )}
                  </div>
                </div>
              ))}
           </div>

           <div className="p-4 bg-white border-t shrink-0">
             <Button fullWidth onClick={submitRound}>Xác nhận</Button>
           </div>
        </div>
      )}

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
                  <span className="font-medium">Kết quả ván</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {Object.entries(round.scoreChanges).map(([pid, value]) => {
                    const score = value as number;
                    const pName = gameState.players.find(p => p.id === pid)?.name;
                    return (
                      <div key={pid} className="flex justify-between">
                         <span>{pName}</span>
                         <span className={`${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-400'} font-mono`}>
                           {score > 0 ? '+' : ''}{score}
                         </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
         </div>
      </div>
    </Layout>
  );
};