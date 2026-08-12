import React, { useState } from 'react';
import { Mic, Sun, Moon, Smartphone, Check, Menu, PanelLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLuna } from '../../context/LunaContext';
import { voice } from '../../services/voice';

export function Navbar() {
  const { theme, toggleTheme } = useAuth();
  const { sendMessage, toggleSidebar } = useLuna();
  const [listening, setListening] = useState(false);
  const [installed, setInstalled] = useState(false);

  const handleVoiceTrigger = () => {
    if (!voice.isSupported()) {
      alert('Speech recognition is not supported in this browser environment.');
      return;
    }
    setListening(true);
    voice.listen(
      (transcript) => {
        setListening(false);
        sendMessage(transcript, true);
      },
      (err) => {
        setListening(false);
        console.error('Voice error:', err);
      }
    );
  };

  const handlePWAInstall = () => {
    if (window.deferredPWAEvt) {
      window.deferredPWAEvt.prompt();
      window.deferredPWAEvt.userChoice.then(() => setInstalled(true));
    } else {
      alert('Luna PWA is ready! Use your browser menu to "Add to Home Screen" or Install.');
      setInstalled(true);
    }
  };

  return (
    <header className="navbar-container" style={{
      height: '64px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      {/* Sidebar Toggle Button & Live Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={toggleSidebar}
          className="btn-secondary"
          title="Toggle Sidebar (Show / Hide)"
          style={{ padding: '8px', borderRadius: '10px' }}
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--accent-success)',
            boxShadow: '0 0 10px var(--accent-success)',
            flexShrink: 0
          }} />
          <span style={{ fontSize: '0.88rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Luna Engine Active
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Voice Trigger Microphone */}
        <button
          onClick={handleVoiceTrigger}
          className="btn-primary"
          style={{
            padding: '8px 14px',
            fontSize: '0.84rem',
            background: listening ? 'var(--accent-danger)' : 'var(--accent-gradient)'
          }}
        >
          <Mic size={16} />
          <span style={{ display: 'var(--mobile-hide, inline)' }}>{listening ? 'Listening...' : 'Speak'}</span>
        </button>

        {/* PWA Install Action */}
        <button
          onClick={handlePWAInstall}
          className="btn-secondary"
          title="Install Luna PWA"
          style={{ padding: '8px 12px' }}
        >
          {installed ? <Check size={16} color="var(--accent-success)" /> : <Smartphone size={16} />}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-secondary"
          title="Toggle Dark/Light Theme"
          style={{ padding: '8px', borderRadius: '50%' }}
        >
          {theme === 'dark' ? <Sun size={18} color="var(--accent-warning)" /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
