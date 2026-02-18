import React, { useState } from 'react';
import { GameMode, Player } from './types';
import { GameSelector } from './components/GameSelector';
import { PlayerSetup } from './components/PlayerSetup';
import { TienLenGame } from './components/TienLenGame';
import { XiDachGame } from './components/XiDachGame';
import { Layout } from './components/Layout';
import { safeGet } from './utils/storage';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>('HOME');
  const [players, setPlayers] = useState<Player[]>([]);
  const [dealerId, setDealerId] = useState<string>('');
  const [step, setStep] = useState<'SELECT' | 'SETUP' | 'PLAY'>('SELECT');

  const handleSelect = (m: GameMode) => {
    setMode(m);
    const key = m === 'TIENLEN' ? 'tienlen_state' : 'xidach_state';
    const saved = safeGet<any>(key, null);
    if (saved?.players?.length > 0) {
      setPlayers(saved.players);
      if (m === 'XIDACH') {
        const d = saved.players.find((p: Player) => p.id === saved.dealerId);
        setDealerId(d ? d.id : saved.players[0].id);
      }
      setStep('PLAY');
    } else {
      setStep('SETUP');
    }
  };

  const handleStart = (p: Player[], d?: string) => {
    setPlayers(p);
    if (d) setDealerId(d);
    else if (p.length > 0) setDealerId(p[0].id);
    setStep('PLAY');
  };

  const back = () => { setStep('SELECT'); setMode('HOME'); setPlayers([]); };

  if (step === 'SELECT') return <GameSelector onSelect={handleSelect} />;
  if (step === 'SETUP') return <Layout title={`Thiết lập ${mode === 'TIENLEN' ? 'Tiến Lên' : 'Xì Dách'}`} onBack={back}><PlayerSetup onStart={handleStart} gameMode={mode as any} /></Layout>;
  if (mode === 'TIENLEN') return <TienLenGame initialPlayers={players} onBack={back} />;
  if (mode === 'XIDACH') return <XiDachGame initialPlayers={players} dealerId={dealerId} onBack={back} />;
  return null;
};

export default App;