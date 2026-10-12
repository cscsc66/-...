import { useState, useEffect, useRef } from 'react';
import { Volume2, Settings, X, Shuffle, Star, VolumeX, Flag, ArrowRight } from 'lucide-react';
import CompletionScreen from './CompletionScreen';
import { playSound } from '../utils/sound';

const defaultSettings = { audio: true, multipleChoice: true, written: true, flashcards: true, shuffle: true, studyStarredOnly: false };

function makeQuestion(card, cards, settings) {
  if (!card) return { currentCard: null, questionType: 'multipleChoice', options: [] };
  const types = ['multipleChoice', 'written', 'flashcards'].filter(type => settings[type]);
  const questionType = types.length ? types[Math.floor(Math.random() * types.length)] : 'multipleChoice';
  const wrong = cards.filter(item => item.id !== card.id).sort(() => 0.5 - Math.random()).slice(0, 3);
  return { currentCard: card, questionType, options: [card, ...wrong].sort(() => 0.5 - Math.random()) };
}

function makeRound(buckets, cards, settings) {
  const remaining = [...buckets.remaining];
  if (settings.shuffle) remaining.sort(() => 0.5 - Math.random());
  const queue = remaining.slice(0, 7);
  return { buckets, queue, showRoundSummary: false, roundStats: { movedToMastered: 0, incorrect: 0 },
    ...makeQuestion(queue[0], cards, settings) };
}

function makeSession(cards, settings, starredIds) {
  const active = settings.studyStarredOnly ? cards.filter(card => starredIds.includes(card.id)) : cards;
  return makeRound({ remaining: active, mastered: [] }, cards, settings);
}

function Learn({ set, onBack, starredIds, onMasteredChange }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [session, setSession] = useState(() => makeSession(set.cards, defaultSettings, starredIds));
  const { buckets, queue, showRoundSummary, roundStats, currentCard, options, questionType } = session;
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const resetAnswer = () => {
    setShowResult(false);
    setSelectedOption(null);
    setWrittenAnswer('');
    setIsFlipped(false);
  };
  const startNextRound = (nextBuckets = buckets) => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    resetAnswer();
    setSession(makeRound(nextBuckets, set.cards, settings));
  };
  const toggleStarredFilter = () => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    const nextSettings = { ...settings, studyStarredOnly: !settings.studyStarredOnly };
    setSettings(nextSettings);
    resetAnswer();
    setSession(makeSession(set.cards, nextSettings, starredIds));
  };
  const speak = (text, lang) => {
    if (!settings.audio || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };
  const processResult = (correct) => {
    if (showResult || timerRef.current !== null) return;
    setShowResult(true);
    if (settings.audio) playSound(correct ? 'correct' : 'wrong');
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const card = queue[0];
      if (!card) return;
      const nextBuckets = {
        remaining: correct ? buckets.remaining.filter(item => item.id !== card.id) : buckets.remaining,
        mastered: correct ? [...buckets.mastered, card] : buckets.mastered
      };
      const nextQueue = queue.slice(1);
      if (!correct) nextQueue.push(card);
      const next = { buckets: nextBuckets, queue: nextQueue,
        showRoundSummary: nextQueue.length === 0 && nextBuckets.remaining.length > 0,
        roundStats: { movedToMastered: roundStats.movedToMastered + Number(correct), incorrect: roundStats.incorrect + Number(!correct) },
        ...makeQuestion(nextQueue[0], set.cards, settings) };
      setSession(next);
      if (correct) onMasteredChange(new Set(nextBuckets.mastered.map(item => item.id)));
      resetAnswer();
    }, 1500);
  };
  const handleSelect = option => {
    if (showResult) return;
    setSelectedOption(option);
    processResult(option.id === currentCard.id);
  };
  const handleWrittenSubmit = e => {
    e.preventDefault();
    if (!writtenAnswer.trim()) return;
    processResult(writtenAnswer.trim().toLowerCase() === currentCard.term.trim().toLowerCase());
  };
  const handleNotSure = () => processResult(false);

  if (buckets.remaining.length === 0 && !showRoundSummary && queue.length === 0 && buckets.mastered.length > 0) {
    return (
      <CompletionScreen 
        onBack={onBack} 
        subtitle="Ви засвоїли всі картки цієї сесії!"
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
              <div className="bar-bg"><div className="bar-fill bg-gray" style={{width: `${(buckets.remaining.length / (buckets.remaining.length + buckets.mastered.length))*100}%`}}></div></div>
              <span>{buckets.remaining.length}</span>
            </div>
            <div className="summary-bar-row">
              <span>Вивчені</span>
              <div className="bar-bg"><div className="bar-fill bg-green" style={{width: `${(buckets.mastered.length / (buckets.remaining.length + buckets.mastered.length))*100}%`}}></div></div>
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

  if (!currentCard) return (
    <div className="mode-container learn-mode">
      <button className="btn secondary" onClick={onBack}>Назад</button>
      <p className="empty-state">Немає позначених карток для навчання.</p>
      <button className="btn primary" onClick={toggleStarredFilter}>Вивчати всі картки</button>
    </div>
  );

  const totalCards = buckets.remaining.length + buckets.mastered.length;
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
            onClick={toggleStarredFilter}
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
                className={`learn-written-input ${showResult ? (writtenAnswer.trim().toLowerCase() === currentCard.term.trim().toLowerCase() ? 'correct' : 'wrong') : ''}`}
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
                  <button className="control-btn learning-btn" disabled={showResult} onClick={() => processResult(false)}>
                    Вивчаю
                  </button>
                  <button className="control-btn known-btn" disabled={showResult} onClick={() => processResult(true)}>
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
