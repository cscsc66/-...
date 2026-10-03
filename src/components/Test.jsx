import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, CheckCircle, XCircle } from 'lucide-react';
import { playSound } from '../utils/sound';

function Test({ set, onBack }) {
  // Setup State
  const [isSetup, setIsSetup] = useState(true);
  const [questionCount, setQuestionCount] = useState(Math.min(20, set.cards.length));
  const [types, setTypes] = useState({
    trueFalse: true,
    multipleChoice: true,
    written: true
  });
  
  // Test State
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const startTest = () => {
    // Generate questions based on settings
    let shuffledCards = [...set.cards].sort(() => 0.5 - Math.random()).slice(0, questionCount);
    
    const availableTypes = [];
    if (types.trueFalse) availableTypes.push('trueFalse');
    if (types.multipleChoice) availableTypes.push('multipleChoice');
    if (types.written) availableTypes.push('written');
    
    if (availableTypes.length === 0) availableTypes.push('multipleChoice'); // Fallback

    const generated = shuffledCards.map((card, index) => {
      const qType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      
      let options = [];
      let tfAnswer = null;
      let tfQuestionTerm = card.definition;

      if (qType === 'multipleChoice') {
        const wrong = set.cards.filter(c => c.id !== card.id).sort(() => 0.5 - Math.random()).slice(0, 3);
        options = [card, ...wrong].sort(() => 0.5 - Math.random());
      } else if (qType === 'trueFalse') {
        const isTrue = Math.random() > 0.5;
        if (isTrue) {
          tfAnswer = true;
          tfQuestionTerm = card.definition;
        } else {
          tfAnswer = false;
          // Pick a random wrong definition
          const wrong = set.cards.filter(c => c.id !== card.id).sort(() => 0.5 - Math.random())[0];
          tfQuestionTerm = wrong ? wrong.definition : card.definition;
          if (!wrong) tfAnswer = true; // Fallback
        }
      }

      return {
        ...card,
        type: qType,
        options,
        tfAnswer,
        tfQuestionTerm,
        questionIndex: index + 1
      };
    });

    setQuestions(generated);
    setAnswers({});
    setIsSubmitted(false);
    setIsSetup(false);
    window.scrollTo(0, 0);
  };

  const handleAnswer = (cardId, answer) => {
    if (isSubmitted) return;
    setAnswers({ ...answers, [cardId]: answer });
  };

  const submitTest = () => {
    let correctCount = 0;
    questions.forEach(q => {
      const ans = answers[q.id];
      if (q.type === 'multipleChoice') {
        if (ans === q.id) correctCount++;
      } else if (q.type === 'trueFalse') {
        if (ans === q.tfAnswer) correctCount++;
      } else if (q.type === 'written') {
        if (ans && ans.toLowerCase().trim() === q.term.toLowerCase().trim()) correctCount++;
      }
    });
    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
    setIsSubmitted(true);
    
    if (finalScore >= 70) {
      playSound('correct');
    } else {
      playSound('wrong');
    }
    
    window.scrollTo(0, 0);
  };

  if (isSetup) {
    return (
      <div className="mode-container test-mode">
        <div className="flashcards-topbar">
          <div className="topbar-left">
            <span className="mode-title">Налаштування тесту</span>
          </div>
          <div className="topbar-right">
            <button className="btn-icon" onClick={onBack}><X size={24}/></button>
          </div>
        </div>

        <div className="test-setup-card">
          <h2 className="mb-4">Налаштуйте свій тест</h2>
          
          <div className="setup-section mb-4 text-left">
            <h4 className="mb-2">Кількість запитань (Макс: {set.cards.length})</h4>
            <input 
              type="number" 
              className="test-input"
              value={questionCount}
              min="1"
              max={set.cards.length}
              onChange={(e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val) || val < 1) val = 1;
                if (val > set.cards.length) val = set.cards.length;
                setQuestionCount(val);
              }}
            />
          </div>

          <div className="setup-section text-left">
            <h4 className="mb-3">Типи запитань</h4>
            <label className="settings-toggle-row mb-3">
              <span>Правда/Неправда</span>
              <div className="toggle-switch">
                <input type="checkbox" checked={types.trueFalse} onChange={e => setTypes({...types, trueFalse: e.target.checked})} />
                <span className="toggle-slider"></span>
              </div>
            </label>
            <label className="settings-toggle-row mb-3">
              <span>З варіантами відповіді</span>
              <div className="toggle-switch">
                <input type="checkbox" checked={types.multipleChoice} onChange={e => setTypes({...types, multipleChoice: e.target.checked})} />
                <span className="toggle-slider"></span>
              </div>
            </label>
            <label className="settings-toggle-row mb-3">
              <span>Письмові</span>
              <div className="toggle-switch">
                <input type="checkbox" checked={types.written} onChange={e => setTypes({...types, written: e.target.checked})} />
                <span className="toggle-slider"></span>
              </div>
            </label>
          </div>

          <button className="btn primary large mt-4" style={{width: '100%'}} onClick={startTest}>
            Почати тест
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted && score === 100) {
    return (
      <CompletionScreen 
        onBack={onBack}
        subtitle="Ви склали тест на ідеальні 100%!"
        primaryAction={() => setIsSetup(true)}
        primaryLabel="Створити новий тест"
      />
    );
  }

  return (
    <div className="mode-container test-mode">
      <div className="flashcards-topbar">
        <div className="topbar-left">
          <span className="mode-title">Тест: {set.title}</span>
        </div>
        <div className="topbar-right">
          <button className="btn-icon" onClick={onBack}><X size={24}/></button>
        </div>
      </div>

      {isSubmitted && (
        <div className="test-score-card">
          <h3>Ваш результат: {score}%</h3>
          <p>{score === 100 ? 'Ідеально! 🎉' : score >= 75 ? 'Чудова робота! 🌟' : 'Спробуйте ще раз! 💪'}</p>
          <button className="btn primary mt-3" onClick={() => setIsSetup(true)}>
            Створити новий тест
          </button>
        </div>
      )}

      <div className="test-questions">
        {questions.map((q) => {
          let isCorrect = false;
          let showFeedback = isSubmitted;
          const ans = answers[q.id];

          if (isSubmitted) {
            if (q.type === 'multipleChoice') isCorrect = ans === q.id;
            else if (q.type === 'trueFalse') isCorrect = ans === q.tfAnswer;
            else if (q.type === 'written') isCorrect = ans && ans.toLowerCase().trim() === q.term.toLowerCase().trim();
          }

          return (
            <div key={q.id} className={`test-question ${showFeedback ? (isCorrect ? 'is-correct' : 'is-wrong') : ''}`}>
              <div className="test-question-header">
                <span className="question-number">{q.questionIndex}</span>
                <span className="question-type-badge">
                  {q.type === 'multipleChoice' && 'Кілька варіантів'}
                  {q.type === 'trueFalse' && 'Правда чи неправда'}
                  {q.type === 'written' && 'Письмово'}
                </span>
              </div>
              
              <h4 className="question-prompt">
                {q.type === 'written' ? q.definition : q.term}
              </h4>
              
              {q.type === 'trueFalse' && (
                <div className="tf-prompt mb-3">
                  Визначення: <strong>{q.tfQuestionTerm}</strong>
                </div>
              )}

              {q.type === 'multipleChoice' && (
                <div className="test-options-grid">
                  {q.options.map(opt => {
                    let btnClass = "test-option-btn";
                    if (isSubmitted) {
                      if (opt.id === q.id) btnClass += " correct";
                      else if (ans === opt.id) btnClass += " wrong";
                      else btnClass += " disabled";
                    } else if (ans === opt.id) {
                      btnClass += " selected";
                    }

                    return (
                      <button 
                        key={opt.id} 
                        className={btnClass}
                        onClick={() => handleAnswer(q.id, opt.id)}
                        disabled={isSubmitted}
                      >
                        {opt.definition}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'trueFalse' && (
                <div className="test-options-grid tf-grid">
                  <button 
                    className={`test-option-btn ${isSubmitted ? (q.tfAnswer === true ? 'correct' : (ans === true ? 'wrong' : 'disabled')) : (ans === true ? 'selected' : '')}`}
                    onClick={() => handleAnswer(q.id, true)}
                    disabled={isSubmitted}
                  >
                    Правда
                  </button>
                  <button 
                    className={`test-option-btn ${isSubmitted ? (q.tfAnswer === false ? 'correct' : (ans === false ? 'wrong' : 'disabled')) : (ans === false ? 'selected' : '')}`}
                    onClick={() => handleAnswer(q.id, false)}
                    disabled={isSubmitted}
                  >
                    Неправда
                  </button>
                </div>
              )}

              {q.type === 'written' && (
                <div className="test-written-area">
                  <input 
                    type="text" 
                    className={`test-input ${showFeedback ? (isCorrect ? 'correct' : 'wrong') : ''}`}
                    placeholder="Введіть термін англійською..."
                    value={ans || ''}
                    onChange={e => handleAnswer(q.id, e.target.value)}
                    disabled={isSubmitted}
                  />
                  {showFeedback && !isCorrect && (
                    <div className="test-feedback-text">
                      Правильна відповідь: <strong>{q.term}</strong>
                    </div>
                  )}
                </div>
              )}

              {showFeedback && (
                <div className="test-feedback-icon">
                  {isCorrect ? <CheckCircle color="#4caf50" size={32}/> : <XCircle color="#f44336" size={32}/>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isSubmitted && (
        <button className="btn primary submit-test-btn mb-5" onClick={submitTest}>
          Перевірити відповіді
        </button>
      )}
    </div>
  );
}

export default Test;
