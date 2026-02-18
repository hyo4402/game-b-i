import React, { useState, useEffect } from 'react';
import { Player, GameState, DEFAULT_TIENLEN_RULES, TienLenRules } from '../types';
import { Scoreboard } from './Scoreboard';
import { Button } from './Button';
import { Layout } from './Layout';
import { PlayerManager } from './PlayerManager';
import { Undo2, History, X, Settings, Save, Users } from 'lucide-react';
import { playSound, triggerConfetti } from '../utils/audio';
import { safeGet, safeSet } from '../utils/storage';

interface Props { initialPlayers: Player[]; onBack: () => void; }

export const TienLenGame: React.FC<Props> = ({ initialPlayers, onBack }) => {
  const [state, setState] = useState<GameState>(() => {
    const saved = safeGet<GameState | null>('tienlen_state', null);
    if (saved) {
      if (!saved.tienLenRules) saved.tienLenRules = DEFAULT_TIENLEN_RULES;
      if (!saved.players) saved.players = initialPlayers;
      if (!saved.history) saved.history = [];
      return saved;
    }
    return { players: initialPlayers, history: [], tienLenRules: DEFAULT_TIENLEN_RULES };
  });

  const [mode, setMode] = useState<'NONE' | 'RANKING' | 'PIG' | 'SETTINGS' | 'PLAYERS'>('NONE');
  const [ranks, setRanks] = useState<string[]>([]);
  const [pigCutter, setPigCutter] = useState<string | null>(null);
  const [pigVictim, setPigVictim] = useState<string | null>(null);
  const [rules, setRules] = useState<TienLenRules>(state.tienLenRules || DEFAULT_TIENLEN_RULES);

  useEffect(() => safeSet('tienlen_state', state), [state]);

  const update = (changes: Record<string, number>, desc: string) => {
    const players = state.players.map(p => ({ ...p, score: p.score + (changes[p.id] || 0) }));
    const round = { id: Date.now().toString(), timestamp: Date.now(), description: desc, scoreChanges: changes };
    setState(prev => ({ ...prev, players, history: [round, ...prev.history] }));
  };

  const submitRank = () => {
    const changes: Record<string, number> = {};
    const r = state.tienLenRules || DEFAULT_TIENLEN_RULES;
    const count = ranks.length;
    if (count < 2) return;
    changes[ranks[0]] = r.FIRST;
    changes[ranks[count - 1]] = r.LAST;
    if (count >= 4) { changes[ranks[1]] = r.SECOND; changes[ranks[2]] = r.THIRD; }
    else if (count === 3) { changes[ranks[1]] = 0; }
    update(changes, 'Xếp hạng');
    setMode('NONE'); setRanks([]); triggerConfetti(); playSound('win');
  };

  const submitPig = (type: 'BLACK' | 'RED') => {
    if (!pigCutter || !pigVictim) return;
    const r = state.tienLenRules || DEFAULT_TIENLEN_RULES;
    const points = type === 'BLACK' ? r.PIG_BLACK : r.PIG_RED;
    update({ [pigCutter]: points, [pigVictim]: -points }, `Phạt ${type === 'BLACK' ? 'Heo Đen' : 'Heo Đỏ'}`);
    playSound('coin');
  };

  const undo = () => {
    if (!state.history.length) return;
    const last = state.history[0];
    const players = state.players.map(p => ({ ...p, score: p.score - (last.scoreChanges[p.id] || 0) }));
    setState({ ...state, players, history: state.history.slice(1) });
    playSound('click');
  };

  return (
    <Layout title="Tiến Lên" onBack={onBack} onReset={() => setState({ ...state, players: state.players.map(p => ({ ...p, score: 0 })), history: [] })}>
      <Scoreboard players={state.players} />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button onClick={() => setMode('RANKING')} className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-tet-red to-rose-600"><span className="text-3xl">🏆</span><span>Xếp Hạng</span></Button>
        <div className="flex flex-col gap-3">
          <Button variant="secondary" onClick={() => setMode('PIG')} className="flex-1 flex items-center justify-center gap-2"><span className="text-2xl">🐷</span><span>Heo & Hàng</span></Button>
          <div className="grid grid-cols-2 gap-2 h-10">
            <Button variant="outline" onClick={() => setMode('PLAYERS')} className="text-xs bg-gray-100 dark:bg-gray-800 shadow-none"><Users className="w-3 h-3" /> Mem</Button>
            <Button variant="outline" onClick={() => { setRules(state.tienLenRules || DEFAULT_TIENLEN_RULES); setMode('SETTINGS'); }} className="text-xs bg-gray-100 dark:bg-gray-800 shadow-none"><Settings className="w-3 h-3" /> Luật</Button>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between px-2"><h3 className="font-bold text-gray-500 text-sm flex gap-2"><History className="w-4 h-4" /> Lịch sử</h3><button onClick={undo} disabled={!state.history.length} className="text-sm text-blue-600 font-medium disabled:opacity-30 flex gap-1"><Undo2 className="w-4 h-4" /> Hoàn tác</button></div>
        <div className="space-y-2">
          {state.history.map(r => (
            <div key={r.id} className="bg-white dark:bg-dark-card p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-sm">
              <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{new Date(r.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span><span className="font-medium text-gray-700 dark:text-gray-300">{r.description}</span></div>
              <div className="flex flex-wrap gap-x-4">{Object.entries(r.scoreChanges).map(([pid, v]) => { const p = state.players.find(x => x.id === pid); if (!v || !p) return null; return <span key={pid} className={`${v>0?'text-tet-win':'text-tet-lose'} font-medium`}>{p.name}: {v>0?'+':''}{v}</span> })}</div>
            </div>
          ))}
          {!state.history.length && <div className="text-center py-8 text-gray-400 text-sm">Chưa có ván nào.</div>}
        </div>
      </div>
      {mode === 'RANKING' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl p-6 shadow-2xl animate-zoom-in">
            <div className="flex justify-between mb-6"><h2 className="text-xl font-bold dark:text-white">Kết quả</h2><button onClick={() => { setMode('NONE'); setRanks([]); }}><X className="w-5 h-5 dark:text-white" /></button></div>
            <div className="grid grid-cols-2 gap-3 mb-6">{state.players.map(p => { const idx = ranks.indexOf(p.id); return <button key={p.id} onClick={() => ranks.includes(p.id) ? setRanks(ranks.filter(id=>id!==p.id)) : setRanks([...ranks, p.id])} className={`p-4 rounded-xl font-semibold relative ${idx!==-1?'bg-tet-gold text-white':'bg-gray-50 dark:bg-gray-800 dark:text-white'}`}>{p.name}{idx!==-1 && <div className="absolute top-2 right-2 bg-white text-yellow-700 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm">{idx+1}</div>}</button> })}</div>
            <Button fullWidth onClick={submitRank} disabled={ranks.length < 2}>Lưu kết quả</Button>
          </div>
        </div>
      )}
      {mode === 'PIG' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl p-6 shadow-2xl animate-zoom-in">
            <div className="flex justify-between mb-6"><h2 className="text-xl font-bold dark:text-white">Thưởng/Phạt Heo</h2><button onClick={() => { setMode('NONE'); setPigCutter(null); setPigVictim(null); }}><X className="w-5 h-5 dark:text-white" /></button></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2"><div className="text-xs font-bold text-green-500 uppercase">Người Thưởng</div><div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar">{state.players.map(p => <button key={p.id} onClick={()=>setPigCutter(p.id)} disabled={pigVictim===p.id} className={`w-full p-2 rounded-xl text-sm font-bold border-2 ${pigCutter===p.id?'border-green-500 bg-green-500 text-white':'bg-gray-50 dark:bg-gray-800 dark:text-white border-transparent'}`}>{p.name}</button>)}</div></div>
              <div className="space-y-2"><div className="text-xs font-bold text-red-500 uppercase">Người Bị Phạt</div><div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar">{state.players.map(p => <button key={p.id} onClick={()=>setPigVictim(p.id)} disabled={pigCutter===p.id} className={`w-full p-2 rounded-xl text-sm font-bold border-2 ${pigVictim===p.id?'border-red-500 bg-red-500 text-white':'bg-gray-50 dark:bg-gray-800 dark:text-white border-transparent'}`}>{p.name}</button>)}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-3"><Button onClick={()=>submitPig('BLACK')} disabled={!pigCutter||!pigVictim} className="bg-gray-800">Heo Đen ({rules.PIG_BLACK})</Button><Button onClick={()=>submitPig('RED')} disabled={!pigCutter||!pigVictim}>Heo Đỏ ({rules.PIG_RED})</Button></div>
          </div>
        </div>
      )}
      {mode === 'SETTINGS' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl p-6 shadow-2xl animate-zoom-in">
             <div className="flex justify-between mb-6"><h2 className="text-xl font-bold dark:text-white">Cài Đặt Luật</h2><button onClick={()=>setMode('NONE')}><X className="w-5 h-5 dark:text-white"/></button></div>
             <div className="space-y-4 mb-6">
                <div><label className="text-xs text-gray-500 font-bold">Nhất (+)</label><input type="number" value={rules.FIRST} onChange={e=>setRules({...rules, FIRST: +e.target.value})} className="w-full mt-1 p-2 border rounded dark:bg-gray-800 dark:text-white"/></div>
                <div><label className="text-xs text-gray-500 font-bold">Chót (-)</label><input type="number" value={rules.LAST} onChange={e=>setRules({...rules, LAST: +e.target.value})} className="w-full mt-1 p-2 border rounded dark:bg-gray-800 dark:text-white"/></div>
             </div>
             <Button fullWidth onClick={()=>{setState({...state, tienLenRules: rules}); setMode('NONE'); playSound('click');}}>Lưu</Button>
          </div>
        </div>
      )}
      {mode === 'PLAYERS' && <PlayerManager players={state.players} onAdd={n=>{const p={id:Date.now().toString(),name:n,score:0}; setState(s=>({...s, players:[...s.players, p]}));}} onRemove={id=>setState(s=>({...s, players:s.players.filter(x=>x.id!==id)}))} onClose={()=>setMode('NONE')}/>}
    </Layout>
  );
};