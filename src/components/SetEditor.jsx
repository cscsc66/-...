import React, { useState } from 'react';
import { Trash2, Plus, Save, X } from 'lucide-react';

function SetEditor({ initialSet, onSave, onCancel }) {
  const [title, setTitle] = useState(initialSet?.title || '');
  const [description, setDescription] = useState(initialSet?.description || '');
  const [cards, setCards] = useState(initialSet?.cards || [{ id: 't1', term: '', definition: '' }, { id: 't2', term: '', definition: '' }]);

  const addCard = () => {
    setCards([...cards, { id: Date.now().toString(), term: '', definition: '' }]);
  };

  const updateCard = (id, field, value) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCard = (id) => {
    if (cards.length > 2) {
      setCards(cards.filter(c => c.id !== id));
    } else {
      alert('Набір має містити щонайменше 2 картки.');
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Будь ласка, введіть назву набору.');
      return;
    }
    const validCards = cards.filter(c => c.term.trim() && c.definition.trim());
    if (validCards.length < 2) {
      alert('Додайте хоча б 2 картки з терміном та визначенням.');
      return;
    }
    
    onSave({
      id: initialSet?.id,
      title: title.trim(),
      description: description.trim(),
      cards: validCards
    });
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2>{initialSet ? 'Редагувати набір' : 'Створити новий набір'}</h2>
        <div className="editor-actions">
          <button className="btn secondary" onClick={onCancel}><X size={20} /> Скасувати</button>
          <button className="btn primary" onClick={handleSave}><Save size={20} /> Зберегти</button>
        </div>
      </div>

      <div className="editor-info-form">
        <input 
          type="text" 
          placeholder="Назва набору (напр. Біологія - Розділ 1)" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          className="input-title"
        />
        <input 
          type="text" 
          placeholder="Опис (необов'язково)" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          className="input-desc"
        />
      </div>

      <div className="editor-cards-list">
        {cards.map((card, index) => (
          <div key={card.id} className="editor-card">
            <div className="editor-card-header">
              <span>{index + 1}</span>
              <button className="btn-icon" onClick={() => removeCard(card.id)} title="Видалити картку">
                <Trash2 size={20} />
              </button>
            </div>
            <div className="editor-card-inputs">
              <div className="input-group">
                <input 
                  type="text" 
                  value={card.term} 
                  onChange={e => updateCard(card.id, 'term', e.target.value)}
                  placeholder="Введіть термін"
                />
                <label>Термін</label>
              </div>
              <div className="input-group">
                <input 
                  type="text" 
                  value={card.definition} 
                  onChange={e => updateCard(card.id, 'definition', e.target.value)}
                  placeholder="Введіть визначення"
                />
                <label>Визначення</label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="editor-footer">
        <button className="btn secondary full-width" onClick={addCard}>
          <Plus size={20} /> Додати картку
        </button>
      </div>
    </div>
  );
}

export default SetEditor;
