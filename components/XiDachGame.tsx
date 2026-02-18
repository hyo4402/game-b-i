import React, { useState, useEffect } from 'react';
import { Player, GameState, RoundHistory } from '../types';
import { Scoreboard } from './Scoreboard';
import { Button } from './Button';
import { Layout } from './Layout';
import { PlayerManager } from './PlayerManager';
import { Undo2, History, X, Check, Minus, Zap, Copy, ArrowRightLeft, Crown, Trash2, Users, Plus } from 'lucide-react';
import { playSound, triggerConfetti, vibrate } from '../utils/audio';

interface XiDachGameProps {
  initialPlayers: Player[];
  dealerId: string;
  onBack: () => void;
}

type ResultType = 'WIN' | 'LOSE' | 'DRAW';
type MultiplierType = 1 | 2 | 3;

const CHIP_VALUES = [5, 10, 20, 50, 100, 200, 500];

export const XiDachGame: React.FC<XiDachGameProps> = ({ initialPlayers, dealerId, onBack }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('xidach_state');
    const parsed = saved ? JSON.parse(saved) : { players: initialPlayers, history: [], dealerId };
    
    // Ensure data integrity if props change but local storage is stale
    if (!parsed.players || parsed.players.length === 0) parsed.players = initialPlayers;
    
    if (!parsed.defaultBets) parsed.defaultBets = {};
    if (!parsed.dealerId && dealerId) parsed.dealerId = dealerId; 
    // Fallback if dealerID is missing in saved state but present in props or players
    if (!parsed.dealerId && parsed.players.length > 0) parsed.dealerId = parsed.players[0].id;
    return parsed;
  });

  const [bets, setBets] = useState<Record<string, string>>({}); 
  const [results, setResults] = useState<Record<string, ResultType>>({});
  const [multipliers, setMultipliers] = useState<Record<string, MultiplierType>>({});
  const [dealerMultiplier, setDealerMultiplier] = useState<MultiplierType>(1);
  const [isRoundOpen, setIsRoundOpen] = useState(false);
  const [isChangeDealerOpen, setIsChangeDealerOpen] = useState(false);
  const [isPlayerManagerOpen, setIsPlayerManagerOpen] = useState(false);

  useEffect(() => { localStorage.setItem('xidach_state', JSON.stringify(gameState)); }, [gameState]);

  // Sync state when round opens OR players change
  useEffect(() => {
    if (isRoundOpen) {
       setBets(prev => {
           const newBets = { ...prev };
           gameState.players.forEach(p => {
               if (p.id !== gameState.dealerId && !newBets[p.id]) {
                   newBets[p.id] = (gameState.defaultBets?.[p.id] || 10).toString();
               }
           });
           return newBets;
       });

       setResults(prev => {
           const newRes = { ...prev };
           gameState.players.forEach(p => {
               if (p.id !== gameState.dealerId && !newRes[p.id]) {
                   newRes[p.id] = 'LOSE';
               }
           });
           return newRes;
       });

       setMultipliers(prev => {
           const newMult = { ...prev };
           gameState.players.forEach(p => {
               if (p.id !== gameState.dealerId && !newMult[p.id]) {
                   newMult[p.id] = 1;
               }
           });
           return newMult;
       });
    }
  }, [isRoundOpen, gameState.players.length, gameState.dealerId]); 

  // --- PLAYER MANAGEMENT LOGIC ---
  const handleAddPlayer = (name: string) => {
      const newPlayer: Player = { id: Date.now().toString(), name, score: 0 };
      setGameState(prev => ({
          ...prev,
          players: [...prev.players, newPlayer],
          defaultBets: { ...prev.defaultBets, [newPlayer.id]: 10 } // Default bet 10k
      }));
  };

  const handleRemovePlayer = (id: string) => {
      if (id === gameState.dealerId) return; // Prevention handled in Modal too
      setGameState(prev => ({
          ...prev,
          players: prev.players.filter(p => p.id !== id)
      }));
  };

  const updateScores = (changes: Record<string, number>, description: string) => {
    const newPlayers = gameState.players.map(p => ({ ...p, score: p.score + (changes[p.id] || 0) }));
    const newRound: RoundHistory = { id: Date.now().toString(), timestamp: Date.now(), description, scoreChanges: changes };
    setGameState(prev => ({ ...prev, players: newPlayers, history: [newRound, ...prev.history] }));
  };

  const changeDealer = (newDealerId: string) => { 
    setGameState(prev => ({ ...prev, dealerId: newDealerId })); 
    setIsChangeDealerOpen(false); 
    playSound('click'); 
  };

  const submitRound = () => {
    const changes: Record<string, number> = {};
    const newDefaultBets = { ...(gameState.defaultBets || {}) };
    let dealerDelta = 0;
    let hasBigWin = false;

    gameState.players.forEach(p => {
      if (p.id === gameState.dealerId) return;
      
      // Safety check if player was removed mid-round (unlikely but possible)
      if (!bets[p.id]) return;

      const betAmount = parseInt(bets[p.id] || '0', 10);
      newDefaultBets[p.id] = betAmount;
      const playerMult = multipliers[p.id] || 1;
      const result = results[p.id] || 'LOSE';
      let finalChange = 0;

      if (dealerMultiplier > 1) {
         if (playerMult === dealerMultiplier) finalChange = 0; 
         else if (playerMult > dealerMultiplier) { finalChange = betAmount * playerMult; hasBigWin = true; }
         else finalChange = -(betAmount * dealerMultiplier);
      } else {
         if (playerMult > 1) { finalChange = betAmount * playerMult; hasBigWin = true; }
         else {
             if (result === 'WIN') finalChange = betAmount;
             else if (result === 'LOSE') finalChange = -betAmount;
         }
      }
      if (finalChange !== 0) { changes[p.id] = finalChange; dealerDelta -= finalChange; }
    });

    // Dealer update
    if (gameState.dealerId) {
        changes[gameState.dealerId] = dealerDelta;
    }
    
    if (dealerDelta > 100 || dealerMultiplier > 1) hasBigWin = true;

    if (hasBigWin) { triggerConfetti(); playSound('win'); } else { playSound('coin'); }

    setGameState(prev => ({ ...prev, defaultBets: newDefaultBets }));
    updateScores(changes, dealerMultiplier === 2 ? 'Chủ Xị Xì Dách' : dealerMultiplier === 3 ? 'Chủ Xị Xì Bàn' : 'Kết quả ván');
    setIsRoundOpen(false);
    
    // Reset Round State (optional, but good for cleanup)
    setDealerMultiplier(1);
  };
  
  const undoLast = () => { if (gameState.history.length === 0) return; const last = gameState.history[0]; const newPlayers = gameState.players.map(p => ({ ...p, score: p.score - (last.scoreChanges[p.id] || 0) })); setGameState({ ...gameState, players: newPlayers, history: gameState.history.slice(1) }); playSound('click'); };
  
  const resetGame = () => setGameState({ ...gameState, players: gameState.players.map(p => ({ ...p, score: 0 })), history: [] });

  const toggleMultiplier = (pid: string, val: MultiplierType) => { 
      setMultipliers(prev => { 
          const current = prev[pid]; 
          const newVal = current === val ? 1 : val; 
          if (dealerMultiplier === 1 && newVal > 1) setResults(r => ({...r, [pid]: 'WIN'})); 
          return {...prev, [pid]: newVal}; 
      }); 
      playSound('click'); 
  }
  
  const addChips = (amount: number) => {
     const newBets = {...bets};
     gameState.players.forEach(p => {
         if (p.id !== gameState.dealerId) {
             const current = parseInt(newBets[p.id] || '0', 10);
             newBets[p.id] = (current + amount).toString();
         }
     });
     setBets(newBets);
     playSound('coin');
     vibrate(5);
  }
  
  const clearBets = () => {
     const newBets: Record<string, string> = {};
     gameState.players.forEach(p => { if (p.id !== gameState.dealerId) newBets[p.id] = '0'; });
     setBets(newBets);
     playSound('click');
  }

  const setAllResults = (type: ResultType) => {
      const newResults: Record<string, ResultType> = {};
      gameState.players.forEach(p => { if (p.id !== gameState.dealerId) newResults[p.id] = type; });
      setResults(newResults);
      playSound('click');
  }

  const copyBet = () => {
      const activePlayers = gameState.players.filter(p => p.id !== gameState.dealerId);
      if (activePlayers.length === 0) return;
      const firstBet = bets[activePlayers[0].id] || '0';
      
      const newBets: Record<string, string> = {};
      gameState.players.forEach(p => { if (p.id !== gameState.dealerId) newBets[p.id] = firstBet; });
      setBets(newBets);
      playSound('coin');
  }

  const dealerName = gameState.players.find(p => p.id === gameState.dealerId)?.name || 'Chủ Xị';

  return (
    <Layout title="Xì Dách" onBack={onBack} onReset={resetGame}>
      <Scoreboard players={gameState.players} dealerId={gameState.dealerId} />

      {!isRoundOpen ? (
        <>
        <div className="mb-6 space-y-3">
          <div className="flex gap-3">
             <Button fullWidth onClick={() => setIsRoundOpen(true)} className="h-16 text-lg shadow-floating bg-gradient-to-r from-tet-red to-rose-600 border-0">Bắt đầu ván mới</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setIsChangeDealerOpen(true)} className="flex items-center justify-center gap-2 text-xs bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 h-10">
                  <ArrowRightLeft className="w-4 h-4 text-gray-500" /> Đổi Chủ Xị
              </Button>
              <Button variant="outline" onClick={() => setIsPlayerManagerOpen(true)} className="flex items-center justify-center gap-2 text-xs bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 h-10">
                  <Users className="w-4 h-4 text-gray-500" /> Thành viên
              </Button>
          </div>
          <p className="text-center text-xs text-gray-400 font-medium mt-2">Điểm góp vui được lưu tự động.</p>
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
                        const isDealer = pid === (gameState.dealerId || dealerId);
                        
                        return (
                            <span key={pid} className={`${score > 0 ? 'text-tet-win' : 'text-tet-lose'} font-medium flex items-center gap-1`}>
                                {isDealer && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500"/>}
                                {pName}: {score > 0 ? '+' : ''}{score}
                            </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {gameState.history.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">Chưa có ván nào.</div>}
             </div>
          </div>
        </>
      ) : (
        <div className="fixed inset-0 bg-[#F8FAFC] dark:bg-dark-bg z-50 flex flex-col transition-colors">
           <div className="bg-white dark:bg-dark-card px-4 py-2 flex items-center justify-between shadow-sm shrink-0 z-10 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                 <div className="bg-tet-gold/20 p-2 rounded-full"><Crown className="w-5 h-5 text-yellow-600" /></div>
                 <div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chủ Xị</div><div className="font-bold text-gray-900 dark:text-white leading-tight">{dealerName}</div></div>
              </div>
              <button onClick={() => setIsRoundOpen(false)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5 text-gray-500" /></button>
           </div>
           
           <div className="bg-white dark:bg-dark-card px-4 py-4 border-b border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-10">
              <div className="grid grid-cols-3 gap-3">
                 {[1, 2, 3].map(m => (
                   <button key={m} onClick={() => { setDealerMultiplier(m as MultiplierType); playSound('click'); }} className={`py-3 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all ${dealerMultiplier === m ? (m===1?'border-gray-800 bg-gray-800 text-white dark:border-gray-500 dark:bg-gray-600':m===2?'border-indigo-500 bg-indigo-500 text-white':'border-purple-500 bg-purple-500 text-white') : 'border-gray-100 bg-white text-gray-400 dark:bg-gray-800 dark:border-gray-700'}`}>
                      {m===1?'Thường':m===2?'Xì Dách (x2)':'Xì Bàn (x3)'}
                   </button>
                 ))}
              </div>
           </div>

           {/* Quick Chips Bar - Additive */}
           <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
               <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
                   <button onClick={clearBets} className="shrink-0 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg mr-2"><Trash2 className="w-4 h-4" /></button>
                   {CHIP_VALUES.map(val => (
                      <button key={val} onClick={() => addChips(val)} className="shrink-0 w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm active:scale-95 transition-transform hover:border-tet-red hover:text-tet-red">
                         {val}k
                      </button>
                   ))}
               </div>
               {/* Quick Actions */}
               <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                   <button onClick={() => setAllResults('LOSE')} className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-bold whitespace-nowrap"><Zap className="w-3 h-3 inline"/> Chủ xị tất tay</button>
                   <button onClick={() => setAllResults('DRAW')} className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded text-xs font-bold whitespace-nowrap">Hòa cả làng</button>
                   <button onClick={copyBet} className="px-3 py-1 bg-white border rounded text-xs font-bold whitespace-nowrap"><Copy className="w-3 h-3 inline"/> Copy điểm</button>
               </div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-dark-bg">
              {gameState.players.filter(p => p.id !== gameState.dealerId).map(p => {
                const playerMult = multipliers[p.id] || 1;
                const isPlayerSpecial = playerMult > 1;
                const isDealerSpecial = dealerMultiplier > 1;
                const result = results[p.id]; 
                
                let cardBg = 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700';
                let statusColor = 'text-gray-400';
                let statusText = '';

                // Visual Feedback Logic
                if (isDealerSpecial) {
                    if (playerMult === dealerMultiplier) { cardBg = 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'; statusText = 'HÒA CÙNG HÀNG'; statusColor = 'text-yellow-600 dark:text-yellow-400'; }
                    else if (playerMult > dealerMultiplier) { cardBg = 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'; statusText = 'MAY MẮN'; statusColor = 'text-green-600 dark:text-green-400'; }
                    else { cardBg = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'; statusText = `THUA x${dealerMultiplier}`; statusColor = 'text-red-600 dark:text-red-400'; }
                } else if (isPlayerSpecial) {
                     cardBg = 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'; statusText = `THẮNG x${playerMult}`; statusColor = 'text-green-600 dark:text-green-400';
                } else {
                    if (result === 'WIN') { cardBg = 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'; statusColor = 'text-green-600 dark:text-green-400'; }
                    else if (result === 'LOSE') { cardBg = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'; statusColor = 'text-red-600 dark:text-red-400'; }
                    else { cardBg = 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'; statusColor = 'text-yellow-600 dark:text-yellow-400'; }
                }

                return (
                <div key={p.id} className={`p-4 rounded-2xl shadow-sm border transition-all duration-300 ${cardBg} ${result === 'WIN' || isPlayerSpecial ? 'shadow-md' : ''}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="overflow-hidden">
                       <div className="font-bold text-lg truncate text-gray-900 dark:text-gray-100">{p.name}</div>
                       {statusText && <div className={`text-[10px] font-black uppercase tracking-wider ${statusColor}`}>{statusText}</div>}
                    </div>
                    <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-900/50 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                      <input type="number" inputMode="numeric" value={bets[p.id] || ''} onChange={(e) => setBets({...bets, [p.id]: e.target.value})} className="w-12 text-right font-mono font-bold bg-transparent outline-none text-gray-900 dark:text-white text-lg" />
                      <span className="text-gray-400 text-xs font-bold">điểm</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                     {(!isDealerSpecial && !isPlayerSpecial) && (
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => { setResults({...results, [p.id]: 'LOSE'}); playSound('lose'); }} className={`py-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${results[p.id] === 'LOSE' ? 'bg-tet-red text-white shadow-lg' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400'}`}>Góp</button>
                          <button onClick={() => { setResults({...results, [p.id]: 'DRAW'}); playSound('click'); }} className={`py-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${results[p.id] === 'DRAW' ? 'bg-tet-gold text-white shadow-lg' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400'}`}>Hòa</button>
                          <button onClick={() => { setResults({...results, [p.id]: 'WIN'}); playSound('win'); }} className={`py-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${results[p.id] === 'WIN' ? 'bg-tet-win text-white shadow-lg' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400'}`}>Nhận</button>
                        </div>
                     )}
                    <div className="flex gap-2">
                       <button onClick={() => toggleMultiplier(p.id, 2)} className={`flex-1 py-2 rounded-xl text-[10px] uppercase tracking-wider font-bold border-2 transition-all ${multipliers[p.id] === 2 ? 'border-indigo-500 bg-indigo-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'}`}>Xì Dách (x2)</button>
                       <button onClick={() => toggleMultiplier(p.id, 3)} className={`flex-1 py-2 rounded-xl text-[10px] uppercase tracking-wider font-bold border-2 transition-all ${multipliers[p.id] === 3 ? 'border-purple-500 bg-purple-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'}`}>Xì Bàn (x3)</button>
                    </div>
                  </div>
                </div>
              )})}
           </div>
           <div className="p-4 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-gray-800 shrink-0 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
             <Button fullWidth onClick={submitRound} className="h-14 text-lg shadow-floating bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900">Xác nhận</Button>
           </div>
        </div>
      )}
       {isChangeDealerOpen && (
         <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-dark-card w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-zoom-in border border-gray-200 dark:border-gray-700">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-gray-500" /> Chọn Chủ Xị Mới</h3>
               <div className="space-y-2 max-h-[50vh] overflow-y-auto mb-4 custom-scrollbar">
                  {gameState.players.map(p => (
                     <button key={p.id} onClick={() => changeDealer(p.id)} className={`w-full p-4 rounded-xl flex items-center justify-between border-2 transition-all ${gameState.dealerId === p.id ? 'border-tet-red bg-red-50 dark:bg-red-900/30 text-tet-red font-bold' : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <span>{p.name}</span>{gameState.dealerId === p.id && <Crown className="w-4 h-4 fill-current" />}
                     </button>
                  ))}
               </div>
               <Button variant="ghost" fullWidth onClick={() => setIsChangeDealerOpen(false)}>Hủy</Button>
            </div>
         </div>
      )}

      {isPlayerManagerOpen && (
          <PlayerManager 
              players={gameState.players}
              dealerId={gameState.dealerId}
              onAdd={handleAddPlayer}
              onRemove={handleRemovePlayer}
              onClose={() => setIsPlayerManagerOpen(false)}
          />
      )}
    </Layout>
  );
};