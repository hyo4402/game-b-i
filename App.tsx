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
  const [step, setStep] = useState<'SELECT_GAME' | 'SETUP_PLAYERS' | 'PLAYING'>('SELECT_GAME');

  const handleGameSelect = (selectedMode: GameMode) => {
    setMode(selectedMode);
    
    // Attempt to resume previous session safely
    const storageKey = selectedMode === 'TIENLEN' ? 'tienlen_state' : 'xidach_state';
    const savedState = safeGet<any>(storageKey, null);

    if (savedState && savedState.players && Array.isArray(savedState.players) && savedState.players.length > 0) {
        setPlayers(savedState.players);
        
        if (selectedMode === 'XIDACH') {
            // Validate dealer
            const validDealer = savedState.players.find((p: Player) => p.id === savedState.dealerId);
            setDealerId(validDealer ? validDealer.id : savedState.players[0].id);
        }
        
        setStep('PLAYING');
    } else {
        setStep('SETUP_PLAYERS');
    }
  };

  const handleStartGame = (setupPlayers: Player[], dealer?: string) => {
    setPlayers(setupPlayers);
    if (dealer) setDealerId(dealer);
    else if (setupPlayers.length > 0) setDealerId(setupPlayers[0].id);
    setStep('PLAYING');
  };

  const handleBack = () => {
    setStep('SELECT_GAME');
    setMode('HOME');
    setPlayers([]);
  };

  if (step === 'SELECT_GAME') {
    return <GameSelector onSelect={handleGameSelect} />;
  }

  if (step === 'SETUP_PLAYERS') {
    return (
      <Layout title={`Thiết lập ${mode === 'TIENLEN' ? 'Tiến Lên' : 'Xì Dách'}`} onBack={handleBack}>
        <PlayerSetup onStart={handleStartGame} gameMode={mode as 'TIENLEN' | 'XIDACH'} />
      </Layout>
    );
  }

  if (mode === 'TIENLEN') {
    return <TienLenGame initialPlayers={players} onBack={handleBack} />;
  }

  if (mode === 'XIDACH') {
    return <XiDachGame initialPlayers={players} dealerId={dealerId} onBack={handleBack} />;
  }

  return null;
};

export default App;