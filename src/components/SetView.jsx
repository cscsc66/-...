import React from 'react';
import { Play, Brain, GraduationCap, Zap, Edit2, Trash2 } from 'lucide-react';

function SetView({ set, navigate, onEdit, onDelete }) {
  return (
    <div className="set-view-container">
      <div className="set-header">
        <div>
          <h2>{set.title}</h2>
          <p>{set.description}</p>
          <span className="card-count">{set.cards.length} термінів</span>
        </div>
        <div className="set-actions">
          <button className="btn-icon" onClick={onEdit} title="Редагувати"><Edit2 size={20} /></button>
          <button className="btn-icon danger" onClick={() => {
            if(window.confirm('Ви впевнені, що хочете видалити цей набір?')) onDelete();
          }} title="Видалити"><Trash2 size={20} /></button>
        </div>
      </div>

      <div className="modes-grid">
        <div className="mode-card" onClick={() => navigate('flashcards')}>
          <Play className="mode-icon" />
          <h3>Картки</h3>
          <p>Переглядайте картки для запам'ятовування</p>
        </div>
        <div className="mode-card" onClick={() => navigate('learn')}>
          <Brain className="mode-icon" />
          <h3>Заучування</h3>
          <p>Відповідайте на запитання для вивчення</p>
        </div>
        <div className="mode-card" onClick={() => navigate('test')}>
          <GraduationCap className="mode-icon" />
          <h3>Тест</h3>
          <p>Перевірте свої знання</p>
        </div>
        <div className="mode-card" onClick={() => navigate('match')}>
          <Zap className="mode-icon" />
          <h3>Підбір</h3>
          <p>З'єднуйте картки на час</p>
        </div>
      </div>

      <div className="terms-list">
        <h3>Терміни у цьому наборі</h3>
        {set.cards.map(card => (
          <div key={card.id} className="term-row">
            <div className="term-term">{card.term}</div>
            <div className="term-divider"></div>
            <div className="term-def">{card.definition}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SetView;
