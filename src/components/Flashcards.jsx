import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronRight, ChevronLeft, Volume2, X, Settings, 
  Play, Pause, Shuffle, Star, Lightbulb
} from 'lucide-react';

import CompletionScreen from './CompletionScreen';

function Flashcards({ set, onBack, starredIds, onStarredChange, onMasteredChange, masteredIds }) {
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
  const starred = useMemo(() => new Set(starredIds), [starredIds]);
  const [known, setKnown] = useState(() => new Set(masteredIds));
  const [learning, setLearning] = useState(new Set());
  
  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [orderedCards, setOrderedCards] = useState(set.cards);
  const cardsOrder = useMemo(() => settings.studyStarredOnly ? orderedCards.filter(card => starred.has(card.id)) : orderedCards, [orderedCards, settings.studyStarredOnly, starred]);
  
  const [showHint, setShowHint] = useState(false);

  const resetPosition = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setIsCompleted(false);
    setIsPlaying(false);
  };
  const toggleFilter = () => {
    resetPosition();
    setSettings(previous => ({ ...previous, studyStarredOnly: !previous.studyStarredOnly }));
  };
  const toggleShuffle = () => {
    resetPosition();
    setIsShuffled(!isShuffled);
    setOrderedCards(isShuffled ? set.cards : [...set.cards].sort(() => 0.5 - Math.random()));
  };
  const toggleStar = (e, id) => {
    e.stopPropagation();
    const next = new Set(starred);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    if (settings.studyStarredOnly) resetPosition();
    onStarredChange(next);
  };
  const nextCard = useCallback(() => {
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex >= cardsOrder.length - 1) {
      setIsCompleted(true);
      setIsPlaying(false);
    } else {
      setCurrentIndex(index => index + 1);
    }
  }, [currentIndex, cardsOrder.length]);
  const prevCard = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex(index => (index - 1 + cardsOrder.length) % cardsOrder.length);
  };
  useEffect(() => {
    if (!isPlaying || isCompleted || cardsOrder.length === 0) return;
    const timer = setInterval(() => {
      if (!isFlipped) setIsFlipped(true);
      else nextCard();
    }, 3000);
    return () => clearInterval(timer);
  }, [isPlaying, isCompleted, isFlipped, cardsOrder.length, nextCard]);

  const markKnown = (e) => {
    e.stopPropagation();
    const currentId = cardsOrder[currentIndex].id;
    const next = new Set(known).add(currentId);
    setKnown(next);
    setLearning(previous => new Set([...previous].filter(id => id !== currentId)));
    onMasteredChange(next);
    nextCard();
  };

  const markLearning = (e) => {
    e.stopPropagation();
    const currentId = cardsOrder[currentIndex].id;
    setLearning(new Set(learning).add(currentId));
    const next = new Set([...known].filter(id => id !== currentId));
    setKnown(next);
    onMasteredChange(next);
    nextCard();
  };

  const restart = () => {
    resetPosition();
    onMasteredChange(new Set());
    setKnown(new Set());
    setLearning(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setShowSettings(false);
  };

  const speak = (text) => {
    if (!settings.ttsEnabled || !window.speechSynthesis) return;
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
                <input type="checkbox" checked={settings.studyStarredOnly} onChange={toggleFilter} />
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
            <button className={`btn-icon-circle ${isShuffled ? 'active' : ''}`} onClick={toggleShuffle}>
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
