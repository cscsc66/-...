import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { playSound } from '../utils/sound';

function CompletionScreen({ onBack, subtitle, primaryAction, primaryLabel }) {
  useEffect(() => {
    // Play a happy sound
    playSound('correct');
    const timer = setTimeout(() => playSound('correct'), 500);
    return () => clearTimeout(timer);
  }, []);

  const screenContent = (
    <div className="meme-completed-screen">
      <h1 className="meme-title">ХАЙПУЄ ПЛЄСЄНЬ 🍄</h1>
      {subtitle && (
        <p className="meme-subtitle">
          {subtitle}
        </p>
      )}
      <div className="meme-actions">
        {primaryAction && (
          <button className="btn primary large" onClick={primaryAction}>
            {primaryLabel}
          </button>
        )}
        <button className={`btn large ${primaryAction ? 'meme-secondary-btn' : 'primary'}`} onClick={onBack}>
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
