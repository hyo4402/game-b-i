import React, { useState, useEffect } from 'react';
import { Player, GameState } from '../types';
import { Scoreboard } from './Scoreboard';
import { Button } from './Button';
import { Layout } from './Layout';
import { PlayerManager } from './PlayerManager';
import { Undo2, History, X, Zap, Copy, ArrowRightLeft, Crown, Trash2, Users } from 'lucide-react';
import { playSound, triggerConfetti, vibrate } from '../utils/audio';
import { safeGet, safeSet } from '../utils/storage';

interface Props { initialPlayers: Player[]; dealerId: string; onBack: () => void; }

export const XiDachGame: React.FC<Props> = ({ initialPlayers, dealerId, onBack }) => {
  const [state, setState] = useState<GameState>(() => {
    const s = safeGet<GameState | null>('xidach_state', null);
    if (!s || !s.players) return { players: initialPlayers, history: [], dealerId, defaultBets: {} };
    if (!s.dealerId) s.dealerId = dealerId || s.players[0].id;
    return s;
  });
  const [bets, setBets] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, 'WIN'|'LOSE'|'DRAW'>>({});
  const [mults, setMults] = useState<Record<string, 1|2|3>>({});
  const [dealerMult, setDealerMult] = useState<1|2|3>(1);
  const [isOpen, setIsOpen] = useState(false);
  const [showDealer, setShowDealer] = useState(false);
  const [showMgr, setShowMgr] = useState(false);

  useEffect(() => safeSet('xidach_state', state), [state]);
  useEffect(() => {
    if (isOpen) {
      const active = state.players.filter(p => p.id !== state.dealerId);
      setBets(prev => { const n = {...prev}; active.forEach(p => { if(!n[p.id]) n[p.id] = (state.defaultBets?.[p.id]||10).toString(); }); return n; });
      setResults(prev => { const n = {...prev}; active.forEach(p => { if(!n[p.id]) n[p.id] = 'LOSE'; }); return n; });
      setMults(prev => { const n = {...prev}; active.forEach(p => { if(!n[p.id]) n[p.id] = 1; }); return n; });
    }
  }, [isOpen, state.players.length, state.dealerId]);

  const submit = () => {
    const changes: Record<string, number> = {};
    const newDefs = { ...(state.defaultBets || {}) };
    let dealerDelta = 0;
    let bigWin = false;

    state.players.forEach(p => {
      if (p.id === state.dealerId || !bets[p.id]) return;
      const bet = parseInt(bets[p.id] || '0', 10);
      newDefs[p.id] = bet;
      const pm = mults[p.id] || 1;
      const res = results[p.id] || 'LOSE';
      let delta = 0;

      if (dealerMult > 1) {
        if (pm === dealerMult) delta = 0;
        else if (pm > dealerMult) { delta = bet * pm; bigWin = true; }
        else delta = -(bet * dealerMult);
      } else {
        if (pm > 1) { delta = bet * pm; bigWin = true; }
        else {
          if (res === 'WIN') delta = bet;
          else if (res === 'LOSE') delta = -bet;
        }
      }
      if (delta !== 0) { changes[p.id] = delta; dealerDelta -= delta; }
    });

    if (state.dealerId) changes[state.dealerId] = dealerDelta;
    if (dealerDelta > 100 || dealerMult > 1) bigWin = true;
    if (bigWin) { triggerConfetti(); playSound('win'); } else playSound('coin');

    setState(prev => ({
      ...prev, defaultBets: newDefs,
      players: prev.players.map(p => ({ ...p, score: p.score + (changes[p.id] || 0) })),
      history: [{ id: Date.now().toString(), timestamp: Date.now(), description: dealerMult > 1 ? 'Chủ Xị thắng lớn' : 'Kết quả ván', scoreChanges: changes }, ...prev.history]
    }));
    setIsOpen(false); setDealerMult(1);
  };

  const dealerName = state.players.find(p => p.id === state.dealerId)?.name || 'Chủ Xị';

  return (
    <Layout title="Xì Dách" onBack={onBack} onReset={() => setState({ ...state, players: state.players.map(p => ({ ...p, score: 0 })), history: [] })}>
      <Scoreboard players={state.players} dealerId={state.dealerId} />
      {!isOpen ? (
        <>
          <div className="mb-6 space-y-3">
            <Button fullWidth onClick={() => setIsOpen(true)} className="h-16 text-lg shadow-floating bg-gradient-to-r from-tet-red to-rose-600 border-0">Bắt đầu ván mới</Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowDealer(true)} className="text-xs h-10"><ArrowRightLeft className="w-4 h-4 mr-2" /> Đổi Chủ Xị</Button>
              <Button variant="outline" onClick={() => setShowMgr(true)} className="text-xs h-10"><Users className="w-4 h-4 mr-2" /> Thành viên</Button>
            </div>
            <p className="text-center text-xs text-gray-400 font-medium mt-2">Điểm góp vui được lưu tự động.</p>
          </div>
          <div className="space-y-4">
             <div className="flex justify-between px-2"><h3 className="font-bold text-gray-500 text-sm flex gap-2"><History className="w-4 h-4" /> Lịch sử</h3><button onClick={() => { if(!state.history.length) return; const last=state.history[0]; setState({...state, players: state.players.map(p=>({...p, score:p.score-(last.scoreChanges[p.id]||0)})), history:state.history.slice(1)}); playSound('click'); }} disabled={!state.history.length} className="text-sm text-blue-600 font-medium disabled:opacity-30 flex gap-1"><Undo2 className="w-4 h-4" /> Hoàn tác</button></div>
             <div className="space-y-2">{state.history.map(r => (<div key={r.id} className="bg-white dark:bg-dark-card p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-sm"><div className="flex justify-between text-xs text-gray-400 mb-1"><span>{new Date(r.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span><span>{r.description}</span></div><div className="flex flex-wrap gap-x-4">{Object.entries(r.scoreChanges).map(([pid, v]) => { const p = state.players.find(x => x.id === pid); if (!v || !p) return null; return <span key={pid} className={`${v>0?'text-tet-win':'text-tet-lose'} font-medium`}>{p.name}: {v>0?'+':''}{v}</span> })}</div></div>))}{!state.history.length && <div className="text-center py-8 text-gray-400 text-sm">Chưa có ván nào.</div>}</div>
          </div>
        </>
      ) : (
        <div className="fixed inset-0 bg-[#F8FAFC] dark:bg-dark-bg z-50 flex flex-col transition-colors">
          <div className="bg-white dark:bg-dark-card px-4 py-2 flex items-center justify-between shadow-sm shrink-0 border-b border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-2"><div className="bg-tet-gold/20 p-2 rounded-full"><Crown className="w-5 h-5 text-yellow-600" /></div><div><div className="text-[10px] font-bold text-gray-400 uppercase">Chủ Xị</div><div className="font-bold dark:text-white leading-tight">{dealerName}</div></div></div>
             <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
          </div>
          <div className="bg-white dark:bg-dark-card px-4 py-4 border-b border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-10">
             <div className="grid grid-cols-3 gap-3">{[1, 2, 3].map(m => (<button key={m} onClick={() => { setDealerMult(m as any); playSound('click'); }} className={`py-3 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all ${dealerMult === m ? (m===1?'border-gray-800 bg-gray-800 text-white':m===2?'border-indigo-500 bg-indigo-500 text-white':'border-purple-500 bg-purple-500 text-white') : 'bg-white text-gray-400 dark:bg-gray-800'}`}>{m===1?'Thường':m===2?'Xì Dách (x2)':'Xì Bàn (x3)'}</button>))}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
             <div className="flex gap-2 overflow-x-auto no-scrollbar items-center mb-2"><button onClick={() => {const n={};state.players.forEach(p=>{if(p.id!==state.dealerId)n[p.id]='0'});setBets(n);playSound('click');}} className="shrink-0 p-2 bg-red-100 text-red-600 rounded-lg mr-2"><Trash2 className="w-4 h-4" /></button>{[5, 10, 20, 50, 100, 200, 500].map(v => (<button key={v} onClick={() => {const n={...bets};state.players.forEach(p=>{if(p.id!==state.dealerId)n[p.id]=(parseInt(n[p.id]||'0',10)+v).toString()});setBets(n);playSound('coin');vibrate(5);}} className="shrink-0 w-12 h-12 rounded-full border-2 border-dashed bg-white dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">{v}k</button>))}</div>
             <div className="flex gap-2 overflow-x-auto no-scrollbar"><button onClick={() => {const r={};state.players.forEach(p=>{if(p.id!==state.dealerId)r[p.id]='LOSE'});setResults(r);playSound('lose');}} className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-bold whitespace-nowrap"><Zap className="w-3 h-3 inline"/> Chủ xị tất tay</button><button onClick={() => {const r={};state.players.forEach(p=>{if(p.id!==state.dealerId)r[p.id]='DRAW'});setResults(r);playSound('click');}} className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded text-xs font-bold whitespace-nowrap">Hòa cả làng</button><button onClick={() => {const a=state.players.filter(p=>p.id!==state.dealerId);if(!a.length)return;const b=bets[a[0].id]||'0';const n={};state.players.forEach(p=>{if(p.id!==state.dealerId)n[p.id]=b});setBets(n);playSound('coin');}} className="px-3 py-1 bg-white border rounded text-xs font-bold whitespace-nowrap"><Copy className="w-3 h-3 inline"/> Copy điểm</button></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-dark-bg">
             {state.players.filter(p => p.id !== state.dealerId).map(p => {
               const pm = mults[p.id] || 1; const res = results[p.id];
               const isSpecial = pm > 1 || dealerMult > 1;
               let bg = 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700';
               if (dealerMult > 1) { if (pm === dealerMult) bg='bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200'; else if (pm > dealerMult) bg='bg-green-50 dark:bg-green-900/20 border-green-200'; else bg='bg-red-50 dark:bg-red-900/20 border-red-200'; }
               else if (pm > 1) bg='bg-green-50 dark:bg-green-900/20 border-green-200';
               else if (res === 'WIN') bg='bg-green-50 dark:bg-green-900/20 border-green-200';
               else if (res === 'LOSE') bg='bg-red-50 dark:bg-red-900/20 border-red-200';
               return (
                 <div key={p.id} className={`p-4 rounded-2xl shadow-sm border transition-all ${bg}`}>
                   <div className="flex justify-between items-center mb-4"><div className="font-bold text-lg dark:text-white">{p.name}</div><div className="flex items-center gap-1 bg-white/80 dark:bg-gray-900/50 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600"><input type="number" inputMode="numeric" value={bets[p.id]||''} onChange={e=>setBets({...bets, [p.id]:e.target.value})} className="w-12 text-right font-mono font-bold bg-transparent outline-none dark:text-white text-lg"/><span className="text-gray-400 text-xs font-bold">điểm</span></div></div>
                   <div className="flex flex-col gap-3">
                     {!isSpecial && <div className="grid grid-cols-3 gap-2"><button onClick={()=>{setResults({...results,[p.id]:'LOSE'});playSound('lose')}} className={`py-3 rounded-xl font-bold text-xs ${results[p.id]==='LOSE'?'bg-tet-red text-white':'bg-white dark:bg-gray-800 text-gray-400'}`}>Góp</button><button onClick={()=>{setResults({...results,[p.id]:'DRAW'});playSound('click')}} className={`py-3 rounded-xl font-bold text-xs ${results[p.id]==='DRAW'?'bg-tet-gold text-white':'bg-white dark:bg-gray-800 text-gray-400'}`}>Hòa</button><button onClick={()=>{setResults({...results,[p.id]:'WIN'});playSound('win')}} className={`py-3 rounded-xl font-bold text-xs ${results[p.id]==='WIN'?'bg-tet-win text-white':'bg-white dark:bg-gray-800 text-gray-400'}`}>Nhận</button></div>}
                     <div className="flex gap-2"><button onClick={()=>{setMults(prev=>({...prev,[p.id]:prev[p.id]===2?1:2}));if(dealerMult===1)setResults(r=>({...r,[p.id]:'WIN'}));playSound('click')}} className={`flex-1 py-2 rounded-xl text-[10px] uppercase font-bold border-2 ${mults[p.id]===2?'border-indigo-500 bg-indigo-500 text-white':'bg-white dark:bg-gray-800 text-gray-400'}`}>Xì Dách (x2)</button><button onClick={()=>{setMults(prev=>({...prev,[p.id]:prev[p.id]===3?1:3}));if(dealerMult===1)setResults(r=>({...r,[p.id]:'WIN'}));playSound('click')}} className={`flex-1 py-2 rounded-xl text-[10px] uppercase font-bold border-2 ${mults[p.id]===3?'border-purple-500 bg-purple-500 text-white':'bg-white dark:bg-gray-800 text-gray-400'}`}>Xì Bàn (x3)</button></div>
                   </div>
                 </div>
               );
             })}
          </div>
          <div className="p-4 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-gray-800 shrink-0"><Button fullWidth onClick={submit} className="h-14 text-lg shadow-floating bg-gray-900 text-white dark:bg-white dark:text-gray-900">Xác nhận</Button></div>
        </div>
      )}
      {showDealer && <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white dark:bg-dark-card w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-zoom-in"><h3 className="text-lg font-bold dark:text-white mb-4">Chọn Chủ Xị Mới</h3><div className="space-y-2 mb-4 max-h-60 overflow-y-auto">{state.players.map(p=><button key={p.id} onClick={()=>{setState({...state, dealerId:p.id});setShowDealer(false);playSound('click')}} className={`w-full p-4 rounded-xl flex justify-between border-2 ${state.dealerId===p.id?'border-tet-red bg-red-50 text-tet-red':'bg-gray-50 dark:bg-gray-800 dark:text-white'}`}>{p.name}{state.dealerId===p.id&&<Crown className="w-4 h-4"/>}</button>)}</div><Button variant="ghost" fullWidth onClick={()=>setShowDealer(false)}>Hủy</Button></div></div>}
      {showMgr && <PlayerManager players={state.players} dealerId={state.dealerId} onAdd={n=>{const p={id:Date.now().toString(),name:n,score:0};setState(s=>({...s, players:[...s.players, p]}));}} onRemove={id=>setState(s=>({...s, players:s.players.filter(x=>x.id!==id)}))} onClose={()=>setShowMgr(false)}/>}
    </Layout>
  );
};