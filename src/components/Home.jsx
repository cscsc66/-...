import React from 'react';
import { PlusCircle, Book, CheckCircle } from 'lucide-react';

function Home({ sets, navigate, setEditingSetId, currentUser }) {
  const userSets = currentUser 
    ? sets.filter(s => s.authorId === currentUser.username)
    : sets;

  return (
    <div className="home-container">
      <div className="home-header mt-4">
        <h2>{currentUser ? `Вітаємо, ${currentUser.name}!` : 'Ваші набори'}</h2>
        <button 
          className="btn primary" 
          onClick={() => {
            setEditingSetId(null);
            navigate('editor');
          }}
        >
          <PlusCircle size={20} />
          Створити набір
        </button>
      </div>

      <div className="recent-activity">
        <div className="sets-grid">
          {userSets.length === 0 ? (
            <p className="empty-state">У вас ще немає наборів. Створіть перший!</p>
          ) : (
            userSets.map((set, index) => {
              const progress = index === 0 ? 85 : index === 1 ? 100 : Math.floor(Math.random() * 50);
              
              return (
                <div key={set.id} className="set-card" onClick={() => navigate('set-view', set.id)}>
                  <div className="set-card-content">
                    <h3>{set.title}</h3>
                    <p>{set.description}</p>
                    <span className="card-count">
                      <Book size={16} /> {set.cards.length} термінів
                    </span>
                    
                    <div className="progress-section mt-4">
                      <div className="progress-text">
                        <span>Прогрес</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#4caf50' : '#fb6f92' }}
                        ></div>
                      </div>
                      {progress === 100 && <span className="mastered-badge"><CheckCircle size={14} /> Вивчено</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
