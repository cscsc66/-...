import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft, Volume2, X, Settings, 
  Play, Pause, Shuffle, Star, Lightbulb, 
  Check, X as XIcon
} from 'lucide-react';

import CompletionScreen from './CompletionScreen';

function Flashcards({ set, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    trackProgress: false,
    studyStarredOnly: false,
    frontSide: 'term', // 'term' or 'definition'
    ttsEnabled: true,
  });

  // Card States
  const [starred, setStarred] = useState(new Set());
  const [known, setKnown] = useState(new Set());
  const [learning, setLearning] = useState(new Set());
  
  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [cardsOrder, setCardsOrder] = useState([]);
  
  const [showHint, setShowHint] = useState(false);

  // Initialize cards order
  useEffect(() => {
    let activeCards = [...set.cards];
    
    if (settings.studyStarredOnly && starred.size > 0) {
      activeCards = activeCards.filter(c => starred.has(c.id));
    }
    
    if (isShuffled) {
      activeCards.sort(() => 0.5 - Math.random());
    }
    
    setCardsOrder(activeCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  }, [set.cards, isShuffled, settings.studyStarredOnly, starred]);

  // Autoplay
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        if (!isFlipped) {
          setIsFlipped(true);
        } else {
          nextCard();
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isFlipped, currentIndex, cardsOrder.length]);

  const toggleStar = (e, id) => {
    e.stopPropagation();
    const newStarred = new Set(starred);
    if (newStarred.has(id)) newStarred.delete(id);
    else newStarred.add(id);
    setStarred(newStarred);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setShowHint(false);
    setTimeout(() => {
      setCurrentIndex((prev) => {
        if (prev === cardsOrder.length - 1) {
          setIsCompleted(true);
          return prev;
        }
        return prev + 1;
      });
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setShowHint(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cardsOrder.length) % cardsOrder.length);
    }, 150);
  };

  const markKnown = (e) => {
    e.stopPropagation();
    const currentId = cardsOrder[currentIndex].id;
    setKnown(new Set(known).add(currentId));
    nextCard();
  };

  const markLearning = (e) => {
    e.stopPropagation();
    const currentId = cardsOrder[currentIndex].id;
    setLearning(new Set(learning).add(currentId));
    nextCard();
  };

  const restart = () => {
    setKnown(new Set());
    setLearning(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setShowSettings(false);
  };

  const speak = (text) => {
    if (!settings.ttsEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (/[a-zA-Z]/.test(text)) utterance.lang = 'en-US';
    else utterance.lang = 'uk-UA';
    window.speechSynthesis.speak(utterance);
  };

  if (cardsOrder.length === 0) {
    return (
      <div className="mode-container flashcards-mode">
        <div className="flashcards-topbar">
          <div className="topbar-left">
            <span className="mode-title">Картки</span>
          </div>
          <div className="topbar-right">
            <button className="btn-icon" onClick={() => setShowSettings(true)}><Settings size={20}/></button>
            <button className="btn-icon" onClick={onBack}><X size={24}/></button>
          </div>
        </div>
        <div className="empty-state">Немає карток для відображення. (Можливо вимкнути фільтр "лише із ★")</div>
        {showSettings && renderSettings()}
      </div>
    );
  }

  if (isCompleted) {
    return (
      <CompletionScreen 
        onBack={onBack}
        subtitle="Ви пройшли всі картки!"
        primaryAction={() => {
          setIsCompleted(false);
          setCurrentIndex(0);
          setIsFlipped(false);
        }}
        primaryLabel="Повторити набір"
      />
    );
  }

  const currentCard = cardsOrder[currentIndex];
  
  const frontContent = settings.frontSide === 'term' ? currentCard.term : currentCard.definition;
  const backContent = settings.frontSide === 'term' ? currentCard.definition : currentCard.term;

  function renderSettings() {
    return (
      <div className="settings-modal-overlay">
        <div className="settings-modal">
          <div className="settings-header">
            <h2>Параметри</h2>
            <button className="btn-icon" onClick={() => setShowSettings(false)}><X size={24}/></button>
          </div>
          
          <div className="settings-body">
            <div className="setting-row">
              <div className="setting-info">
                <strong>Відстежуйте прогрес</strong>
                <p>Відсортуйте картки, щоб відстежувати, що ви знаєте.</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={settings.trackProgress} onChange={e => setSettings({...settings, trackProgress: e.target.checked})} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="setting-row">
              <div className="setting-info">
                <strong>Вивчати лише терміни із ★</strong>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={settings.studyStarredOnly} onChange={e => setSettings({...settings, studyStarredOnly: e.target.checked})} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <strong>Передній бік</strong>
              </div>
              <select className="settings-select" value={settings.frontSide} onChange={e => setSettings({...settings, frontSide: e.target.value})}>
                <option value="term">Термін (Англійська)</option>
                <option value="definition">Визначення (Українська)</option>
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <strong>Синтез мовлення (Озвучка)</strong>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={settings.ttsEnabled} onChange={e => setSettings({...settings, ttsEnabled: e.target.checked})} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <button className="btn-text danger mt-4" onClick={restart}>
              Знову розпочати картки
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mode-container flashcards-mode">
      {/* Top Bar */}
      <div className="flashcards-topbar">
        <div className="topbar-left">
          <span className="mode-title">Картки</span>
        </div>
        <div className="topbar-center">
          <span className="progress-text">{currentIndex + 1} / {cardsOrder.length}</span>
          <span className="set-title-small">{set.title}</span>
        </div>
        <div className="topbar-right">
          <button className="btn-icon" onClick={() => setShowSettings(true)}><Settings size={20}/></button>
          <button className="btn-icon" onClick={onBack}><X size={24}/></button>
        </div>
      </div>

      <div className="flashcard-wrapper">
        <div className="flashcard-container">
          <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
            
            {/* Front */}
            <div className="card-face card-front">
              <div className="card-top-actions">
                <button 
                  className="btn-text hint-btn" 
                  onClick={(e) => { e.stopPropagation(); setShowHint(!showHint); }}
                >
                  <Lightbulb size={18}/> {showHint ? 'Сховати підказку' : 'Показати підказку'}
                </button>
                <div className="card-top-right">
                  <button className="btn-icon small" onClick={(e) => { e.stopPropagation(); speak(frontContent); }}><Volume2 size={20}/></button>
                  <button className={`btn-icon small ${starred.has(currentCard.id) ? 'active-star' : ''}`} onClick={(e) => toggleStar(e, currentCard.id)}>
                    <Star size={20} fill={starred.has(currentCard.id) ? "currentColor" : "none"}/>
                  </button>
                </div>
              </div>
              <span className="card-text">{frontContent}</span>
              {showHint && <span className="card-hint">Підказка: {backContent.substring(0, Math.max(3, backContent.length/3))}...</span>}
            </div>
            
            {/* Back */}
            <div className="card-face card-back">
              <div className="card-top-actions">
                <div></div>
                <div className="card-top-right">
                  <button className="btn-icon small" onClick={(e) => { e.stopPropagation(); speak(backContent); }}><Volume2 size={20}/></button>
                  <button className={`btn-icon small ${starred.has(currentCard.id) ? 'active-star' : ''}`} onClick={(e) => toggleStar(e, currentCard.id)}>
                    <Star size={20} fill={starred.has(currentCard.id) ? "currentColor" : "none"}/>
                  </button>
                </div>
              </div>
              <span className="card-text">{backContent}</span>
            </div>
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div className="flashcards-toolbar">
          <div className="toolbar-left">
            <label className="toggle-switch-compact">
              <span>Відстежуйте прогрес</span>
              <div className="toggle-switch">
                <input type="checkbox" checked={settings.trackProgress} onChange={e => setSettings({...settings, trackProgress: e.target.checked})} />
                <span className="toggle-slider"></span>
              </div>
            </label>
          </div>
          
          <div className="toolbar-center">
            {settings.trackProgress ? (
              <div className="progress-controls">
                <button className="control-btn learning-btn" onClick={markLearning}>
                  Вивчаю
                </button>
                <button className="control-btn known-btn" onClick={markKnown}>
                  Знаю
                </button>
              </div>
            ) : (
              <div className="controls">
                <button className="control-btn" onClick={prevCard}><ChevronLeft size={32} /></button>
                <button className="control-btn" onClick={nextCard}><ChevronRight size={32} /></button>
              </div>
            )}
          </div>

          <div className="toolbar-right">
            <button className={`btn-icon-circle ${isPlaying ? 'active' : ''}`} onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
            </button>
            <button className={`btn-icon-circle ${isShuffled ? 'active' : ''}`} onClick={() => setIsShuffled(!isShuffled)}>
              <Shuffle size={20}/>
            </button>
          </div>
        </div>
      </div>

      {showSettings && renderSettings()}
    </div>
  );
}

export default Flashcards;
