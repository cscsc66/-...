import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import SetEditor from './components/SetEditor';
import SetView from './components/SetView';
import Flashcards from './components/Flashcards';
import Learn from './components/Learn';
import Test from './components/Test';
import Match from './components/Match';
import Auth from './components/Auth';
import Profile from './components/Profile';
import { UserCircle } from 'lucide-react';
import './App.css';

const defaultSets = [
  {
    id: 'default-1',
    title: 'Базові англійські слова',
    description: '10 базових слів для початківців',
    authorId: 'system',
    cards: [
      { id: '1', term: 'Apple', definition: 'Яблуко' },
      { id: '2', term: 'Cat', definition: 'Кіт' },
      { id: '3', term: 'Dog', definition: 'Собака' },
      { id: '4', term: 'House', definition: 'Будинок' },
      { id: '5', term: 'Sun', definition: 'Сонце' },
      { id: '6', term: 'Book', definition: 'Книга' },
      { id: '7', term: 'Flower', definition: 'Квітка' },
      { id: '8', term: 'Water', definition: 'Вода' },
      { id: '9', term: 'Friend', definition: 'Друг' },
      { id: '10', term: 'Love', definition: 'Кохання' }
    ]
  }
];

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('marusya-current-user');
    return saved ? JSON.parse(saved) : null;
  });

  const [sets, setSets] = useState(() => {
    const saved = localStorage.getItem('marusya-sets');
    return saved ? JSON.parse(saved) : defaultSets;
  });

  const [currentView, setCurrentView] = useState('home'); // home, library, set-view, editor, flashcards, learn, test, match, profile
  const [showAuth, setShowAuth] = useState(false);
  const [activeSetId, setActiveSetId] = useState(null);
  const [editingSetId, setEditingSetId] = useState(null);

  useEffect(() => {
    localStorage.setItem('marusya-sets', JSON.stringify(sets));
  }, [sets]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('marusya-current-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('marusya-current-user');
    }
  }, [currentUser]);

  const navigate = (view, setId = null) => {
    setCurrentView(view);
    if (setId !== null) setActiveSetId(setId);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setShowAuth(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('home');
  };

  const saveSet = (set) => {
    const setWithAuthor = { 
      ...set, 
      authorId: set.authorId || (currentUser ? currentUser.username : 'guest') 
    };

    if (set.id && sets.find(s => s.id === set.id)) {
      setSets(sets.map(s => s.id === set.id ? setWithAuthor : s));
    } else {
      setWithAuthor.id = Date.now().toString();
      setSets([...sets, setWithAuthor]);
    }
  };

  const deleteSet = (id) => {
    setSets(sets.filter(s => s.id !== id));
    navigate('home');
  };

  const activeSet = sets.find(s => s.id === activeSetId);

  return (
    <div className="app-layout">
      <header className="main-header">
        <div className="header-logo" onClick={() => navigate('home')}>
          Маруся вчить англійську... 🌸
        </div>
        
        <div className="header-actions">
          {currentUser ? (
            <button className="user-profile-btn" onClick={() => navigate('profile')}>
              <UserCircle size={24} />
              <span className="user-name">{currentUser.name}</span>
            </button>
          ) : (
            <button className="btn primary small" onClick={() => setShowAuth(true)}>
              Увійти
            </button>
          )}
        </div>
      </header>

      {showAuth && (
        <Auth onLogin={handleLogin} onCancel={() => setShowAuth(false)} />
      )}

      <main className="content-area">
        {(currentView === 'home' || currentView === 'library') && (
          <Home sets={sets} navigate={navigate} setEditingSetId={setEditingSetId} currentUser={currentUser} />
        )}
        {currentView === 'profile' && currentUser && (
          <Profile user={currentUser} sets={sets} onLogout={handleLogout} navigate={navigate} />
        )}
        {currentView === 'editor' && (
          <SetEditor 
            initialSet={editingSetId ? sets.find(s => s.id === editingSetId) : null} 
            onSave={(set) => {
              saveSet(set);
              navigate('home');
            }} 
            onCancel={() => navigate('home')} 
          />
        )}
        {currentView === 'set-view' && activeSet && (
          <SetView 
            set={activeSet} 
            navigate={navigate} 
            currentUser={currentUser}
            onEdit={() => {
              setEditingSetId(activeSet.id);
              navigate('editor');
            }}
            onDelete={() => deleteSet(activeSet.id)}
          />
        )}
        {currentView === 'flashcards' && activeSet && (
          <Flashcards set={activeSet} onBack={() => navigate('set-view')} />
        )}
        {currentView === 'learn' && activeSet && (
          <Learn set={activeSet} onBack={() => navigate('set-view')} />
        )}
        {currentView === 'test' && activeSet && (
          <Test set={activeSet} onBack={() => navigate('set-view')} />
        )}
        {currentView === 'match' && activeSet && (
          <Match set={activeSet} onBack={() => navigate('set-view')} />
        )}
      </main>
    </div>
  );
}

export default App;
