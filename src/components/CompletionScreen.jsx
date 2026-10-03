import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { playSound } from '../utils/sound';

function CompletionScreen({ onBack, subtitle, primaryAction, primaryLabel }) {
  useEffect(() => {
    // Play a happy sound
    playSound('correct');
    setTimeout(() => playSound('correct'), 500);
  }, []);

  const screenContent = (
    <div className="meme-completed-screen" style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999}}>
      <h1 className="meme-title">ХАЙПУЄ ПЛЄСЄНЬ 🍄</h1>
      {subtitle && (
        <p className="meme-subtitle" style={{fontSize: '1.8rem', color: 'white', textShadow: '0 4px 15px rgba(0,0,0,0.2)', marginTop: '1rem', textAlign: 'center', fontWeight: '600'}}>
          {subtitle}
        </p>
      )}
      <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
        {primaryAction && (
          <button className="btn primary large" onClick={primaryAction} style={{boxShadow: '0 4px 15px rgba(0,0,0,0.2)'}}>
            {primaryLabel}
          </button>
        )}
        <button className={`btn large ${primaryAction ? '' : 'primary'}`} onClick={onBack} style={{boxShadow: '0 4px 15px rgba(0,0,0,0.2)', background: primaryAction ? 'rgba(255,255,255,0.2)' : undefined, color: primaryAction ? 'white' : undefined}}>
          Повернутися до набору
        </button>
      </div>
    </div>
  );
  
  if (typeof document !== 'undefined') {
    return createPortal(screenContent, document.body);
  }
  return screenContent;
}

export default CompletionScreen;
