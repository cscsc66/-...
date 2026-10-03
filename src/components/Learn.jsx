import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, Settings, X, Shuffle, Star, VolumeX, Flag, ArrowRight } from 'lucide-react';
import CompletionScreen from './CompletionScreen';
import { playSound } from '../utils/sound';

function Learn({ set, onBack }) {
  // Bucketing system
  const [buckets, setBuckets] = useState({
    remaining: [],
    mastered: []
  });
  
  const [queue, setQueue] = useState([]);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  
  const [roundStats, setRoundStats] = useState({
    movedToMastered: 0,
    incorrect: 0
  });

  const [currentCard, setCurrentCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  
  // Question Types
  const [questionType, setQuestionType] = useState('multipleChoice');
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    audio: true,
    multipleChoice: true,
    written: true,
    flashcards: true,
    shuffle: true,
    studyStarredOnly: false,
  });

  const [starred, setStarred] = useState(new Set());
  
  // Ref to hold latest state for callbacks if needed, though we use functional state updates
  const bucketsRef = useRef(buckets);
  useEffect(() => { bucketsRef.current = buckets; }, [buckets]);

  useEffect(() => {
    // Start session
    let activeCards = [...set.cards];
    if (settings.studyStarredOnly && starred.size > 0) {
      activeCards = activeCards.filter(c => starred.has(c.id));
    }
    
    if (settings.shuffle) {
      activeCards.sort(() => 0.5 - Math.random());
    }

    const initialBuckets = {
      remaining: activeCards,
      mastered: []
    };
    
    setBuckets(initialBuckets);
    startNextRound(initialBuckets);
  }, [set, settings.studyStarredOnly, starred]); // We don't re-run on shuffle toggle during session

  const startNextRound = (currentBuckets = buckets) => {
    let newRemaining = [...currentBuckets.remaining];
    
    let roundCards = [];
    
    if (settings.shuffle) {
      newRemaining.sort(() => 0.5 - Math.random());
    }

    const remPick = newRemaining.splice(0, 7);
    roundCards.push(...remPick);

    if (roundCards.length === 0) {
      // Completed entirely
      setQueue([]);
      return;
    }

    setQueue(roundCards);
    setRoundStats({ movedToMastered: 0, incorrect: 0 });
    setShowRoundSummary(false);
    prepareQuestion(roundCards[0], set.cards, settings, currentBuckets);
  };

  const prepareQuestion = (card, allCards, currentSettings = settings, currentBuckets = buckets) => {
    setCurrentCard(card);
    setShowResult(false);
    setSelectedOption(null);
    setWrittenAnswer('');
    setIsFlipped(false);

    let type = 'multipleChoice';
    const available = [];
    if (currentSettings.multipleChoice) available.push('multipleChoice');
    if (currentSettings.written) available.push('written');
    if (currentSettings.flashcards) available.push('flashcards');
    
    if (available.length > 0) {
        type = available[Math.floor(Math.random() * available.length)];
    }
    
    setQuestionType(type);

    if (type === 'multipleChoice' || available.length === 0) {
      const wrongCards = allCards.filter(c => c.id !== card.id).sort(() => 0.5 - Math.random()).slice(0, 3);
      const optionsPool = [card, ...wrongCards].sort(() => 0.5 - Math.random());
      setOptions(optionsPool);
    }
  };

  const speak = (text, lang) => {
    if (!settings.audio) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  const processResult = (correct) => {
    setShowResult(true);
    
    if (settings.audio) {
      playSound(correct ? 'correct' : 'wrong');
    }
    
    setTimeout(() => {
      // Use current state to calculate the next state
      const nextBuckets = {
        remaining: [...buckets.remaining],
        mastered: [...buckets.mastered]
      };
      
      let newQueue = [...queue];
      const card = newQueue.shift();
      
      if (correct) {
        nextBuckets.remaining = nextBuckets.remaining.filter(c => c.id !== card.id);
        if (!nextBuckets.mastered.some(c => c.id === card.id)) {
          nextBuckets.mastered.push(card);
        }
        
        setRoundStats(prevStats => ({
          ...prevStats,
          movedToMastered: prevStats.movedToMastered + 1
        }));
      } else {
        setRoundStats(prevStats => ({
          ...prevStats,
          incorrect: prevStats.incorrect + 1
        }));
      }
      
      if (!correct) {
        // Re-add to queue to ask again in this round
        newQueue.push(card);
      }
      
      // Apply states
      setBuckets(nextBuckets);
      setQueue(newQueue);
      
      if (newQueue.length > 0) {
        setTimeout(() => prepareQuestion(newQueue[0], set.cards, settings, nextBuckets), 0);
      } else {
        if (nextBuckets.remaining.length === 0) {
          setShowRoundSummary(false);
        } else {
          setShowRoundSummary(true);
        }
      }
    }, 1500);
  };

  const handleSelect = (option) => {
    if (showResult) return;
    setSelectedOption(option);
    const correct = option && option.id === currentCard.id;
    processResult(correct);
  };

  const handleWrittenSubmit = (e) => {
    e.preventDefault();
    if (showResult || !writtenAnswer.trim()) return;
    
    const correct = writtenAnswer.trim().toLowerCase() === currentCard.term.toLowerCase();
    processResult(correct);
  };

  const handleNotSure = () => {
    if (showResult) return;
    setShowResult(true);
    setTimeout(() => {
      processResult(false); // mark as incorrect
    }, 500);
  };

  if (buckets.remaining.length === 0 && !showRoundSummary && queue.length === 0 && currentCard !== null) {
    return (
      <CompletionScreen 
        onBack={onBack} 
        subtitle="Ви блискуче засвоїли цей набір на 100%!" 
      />
    );
  }

  if (showRoundSummary) {
    return (
      <div className="mode-container learn-mode">
        <div className="flashcards-topbar">
          <div className="topbar-left">
            <span className="mode-title">Заучування</span>
          </div>
          <div className="topbar-right">
            <button className="btn-icon" onClick={onBack}><X size={24}/></button>
          </div>
        </div>
        
        <div className="round-summary-card">
          <h2>Умніца дочка 🚀</h2>
          <p className="summary-subtitle">Ось ваш прогрес за цей раунд:</p>
          
          <div className="summary-stats">
            <div className="stat-box">
              <span className="stat-value text-green">{roundStats.movedToMastered}</span>
              <span className="stat-label">Вивчено</span>
            </div>
            <div className="stat-box">
              <span className="stat-value text-gray">{roundStats.incorrect}</span>
              <span className="stat-label">Помилок</span>
            </div>
          </div>
          
          <div className="summary-progress-bars">
            <div className="summary-bar-row">
              <span>Залишилось</span>
              <div className="bar-bg"><div className="bar-fill bg-gray" style={{width: `${(buckets.remaining.length / set.cards.length)*100}%`}}></div></div>
              <span>{buckets.remaining.length}</span>
            </div>
            <div className="summary-bar-row">
              <span>Вивчені</span>
              <div className="bar-bg"><div className="bar-fill bg-green" style={{width: `${(buckets.mastered.length / set.cards.length)*100}%`}}></div></div>
              <span>{buckets.mastered.length}</span>
            </div>
          </div>
          
          <button className="btn primary large mt-4" onClick={() => startNextRound(buckets)}>
            Продовжити <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  const totalCards = set.cards.length;
  const progressPercent = (buckets.mastered.length / totalCards) * 100;

  function renderSettings() {
    return (
      <div className="settings-popover">
        <div className="settings-popover-header">
          <button 
            className={`popover-action-btn ${settings.shuffle ? 'active' : ''}`}
            onClick={() => setSettings({...settings, shuffle: !settings.shuffle})}
          >
            <Shuffle size={18}/>
          </button>
          <button 
            className={`popover-action-btn ${settings.studyStarredOnly ? 'active' : ''}`}
            onClick={() => setSettings({...settings, studyStarredOnly: !settings.studyStarredOnly})}
          >
            <Star size={18} fill={settings.studyStarredOnly ? "currentColor" : "none"} />
          </button>
          <button 
            className={`popover-action-btn ${settings.audio ? 'active' : ''}`}
            onClick={() => setSettings({...settings, audio: !settings.audio})}
          >
            {settings.audio ? <Volume2 size={18}/> : <VolumeX size={18}/>}
          </button>
        </div>
        
        <div className="settings-popover-body">
          <div className="settings-section-title">Типи запитань</div>
          
          <label className="settings-toggle-row">
            <span>Запитання з варіантами відповіді</span>
            <div className="toggle-switch">
              <input type="checkbox" checked={settings.multipleChoice} onChange={e => {
                const newSet = {...settings, multipleChoice: e.target.checked};
                setSettings(newSet);
              }} />
              <span className="toggle-slider"></span>
            </div>
          </label>
          
          <label className="settings-toggle-row">
            <span>Письмові запитання</span>
            <div className="toggle-switch">
              <input type="checkbox" checked={settings.written} onChange={e => {
                const newSet = {...settings, written: e.target.checked};
                setSettings(newSet);
              }} />
              <span className="toggle-slider"></span>
            </div>
          </label>
          
          <label className="settings-toggle-row">
            <span>Картки</span>
            <div className="toggle-switch">
              <input type="checkbox" checked={settings.flashcards} onChange={e => {
                const newSet = {...settings, flashcards: e.target.checked};
                setSettings(newSet);
              }} />
              <span className="toggle-slider"></span>
            </div>
          </label>
        </div>
        <div className="settings-popover-footer">
          Переглянути всі варіанти
        </div>
      </div>
    );
  }

  return (
    <div className="mode-container learn-mode">
      <div className="flashcards-topbar">
        <div className="topbar-left">
          <span className="mode-title">Заучування</span>
        </div>
        <div className="topbar-right" style={{ position: 'relative' }}>
          <button className="btn-icon" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={20}/>
          </button>
          <button className="btn-icon" onClick={onBack}><X size={24}/></button>
          {showSettings && renderSettings()}
        </div>
      </div>

      <div className="learn-progress-area">
        <div className="learn-progress-track">
          <div className="learn-progress-fill" style={{ width: `${progressPercent}%` }}></div>
          <div className="learn-progress-badge" style={{ left: `${progressPercent}%` }}>
            {Math.round(progressPercent)}%
          </div>
        </div>
      </div>

      <div className="learn-card-container">
        <div className="learn-card-header">
          <span className="learn-label">Визначення</span>
          <button className="btn-icon small" onClick={() => speak(currentCard.definition, 'uk-UA')}><Volume2 size={16}/></button>
        </div>
        
        <div className="learn-question-text">
          {currentCard.definition}
        </div>

        {questionType === 'multipleChoice' && (
          <div className="learn-options-section">
            <div className="learn-label mb-3">Виберіть відповідь</div>
            
            <div className="learn-options-grid">
              {options.map((option, idx) => {
                let btnClass = "learn-option-box";
                if (showResult) {
                  if (option.id === currentCard.id) btnClass += " correct";
                  else if (selectedOption && option.id === selectedOption.id) btnClass += " wrong";
                  else btnClass += " disabled";
                }

                return (
                  <button 
                    key={option.id} 
                    className={btnClass}
                    onClick={() => handleSelect(option)}
                    disabled={showResult}
                  >
                    <span className="option-number">{idx + 1}</span>
                    <span className="option-text">{option.term}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {questionType === 'written' && (
          <div className="learn-written-section">
            <div className="learn-label mb-3">Введіть відповідь</div>
            <form onSubmit={handleWrittenSubmit} className="learn-written-form">
              <input 
                type="text" 
                className={`learn-written-input ${showResult ? (writtenAnswer.trim().toLowerCase() === currentCard.term.toLowerCase() ? 'correct' : 'wrong') : ''}`}
                value={writtenAnswer}
                onChange={(e) => setWrittenAnswer(e.target.value)}
                placeholder="Введіть англійською..."
                disabled={showResult}
                autoFocus
              />
              <button type="submit" className="btn primary" disabled={showResult || !writtenAnswer.trim()}>
                Відповісти
              </button>
            </form>
            {showResult && writtenAnswer.trim().toLowerCase() !== currentCard.term.toLowerCase() && (
              <div className="learn-correct-answer">
                <span className="learn-label">Правильна відповідь:</span>
                <strong>{currentCard.term}</strong>
              </div>
            )}
          </div>
        )}

        {questionType === 'flashcards' && (
          <div className="learn-flashcard-section">
            <div className="learn-label mb-3">Натисніть на картку, щоб перевернути</div>
            <div className="flashcard-container compact" onClick={() => setIsFlipped(true)}>
              <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
                <div className="card-face card-front">
                  <span className="card-text">{currentCard.definition}</span>
                </div>
                <div className="card-face card-back">
                  <span className="card-text">{currentCard.term}</span>
                </div>
              </div>
            </div>
            {isFlipped && (
              <div className="flashcard-actions mt-4">
                <h4 className="mb-3 text-center">Ви знали це?</h4>
                <div className="progress-controls justify-center">
                  <button className="control-btn learning-btn" onClick={() => processResult(false)}>
                    Вивчаю
                  </button>
                  <button className="control-btn known-btn" onClick={() => processResult(true)}>
                    Знаю
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="learn-card-footer">
          <button className="not-sure-btn" onClick={handleNotSure} disabled={showResult}>
            <Flag size={16}/> Не впевнені?
          </button>
        </div>
      </div>
    </div>
  );
}

export default Learn;
