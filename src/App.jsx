import { useState, useEffect } from 'react';
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
import { readStored, writeStored, isRecord, isSets, isStudyData } from './utils/storage';

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
  const [currentUser, setCurrentUser] = useState(() => readStored('marusya-current-user', null,
    value => isRecord(value) && typeof value.username === 'string' && typeof value.name === 'string'));
  const [sets, setSets] = useState(() => readStored('marusya-sets', defaultSets, isSets));
  const studyKey = 'marusya-study-' + (currentUser ? 'user-' + currentUser.username : 'guest');
  const [studyCache, setStudyCache] = useState({});
  const study = studyCache[studyKey] || readStored(studyKey, {}, isStudyData);
  const updateStudy = (setId, field, ids, merge = false) => {
    setStudyCache(previous => {
      const data = previous[studyKey] || readStored(studyKey, {}, isStudyData);
      const previousIds = merge ? data[setId]?.[field] || [] : [];
      const next = {
        ...data,
        [setId]: {
          starred: [], mastered: [], ...data[setId],
          [field]: [...new Set([...previousIds, ...ids])],
        },
      };
      return { ...previous, [studyKey]: next };
    });
  };
  useEffect(() => {
    if (studyCache[studyKey]) writeStored(studyKey, studyCache[studyKey]);
  }, [studyCache, studyKey]);

  const [currentView, setCurrentView] = useState('home'); // home, library, set-view, editor, flashcards, learn, test, match, profile
  const [showAuth, setShowAuth] = useState(false);
  const [activeSetId, setActiveSetId] = useState(null);
  const [editingSetId, setEditingSetId] = useState(null);

  useEffect(() => {
    writeStored('marusya-sets', sets);
  }, [sets]);

  useEffect(() => {
    writeStored('marusya-current-user', currentUser);
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
    setSets(previous => {
      const existing = previous.find(item => item.id === set.id);
      const saved = { ...existing, ...set,
        id: existing?.id || crypto.randomUUID(),
        authorId: existing?.authorId || set.authorId || currentUser?.username || 'guest' };
      return existing ? previous.map(item => item.id === saved.id ? saved : item) : [...previous, saved];
    });
  };

  const deleteSet = (id) => {
    setSets(previous => previous.filter(s => s.id !== id));
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
          <Home study={study} sets={sets} navigate={navigate} setEditingSetId={setEditingSetId} currentUser={currentUser} />
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
          <Flashcards
            key={studyKey + ':' + activeSet.id}
            set={activeSet}
            masteredIds={study[activeSet.id]?.mastered || []}
            starredIds={study[activeSet.id]?.starred || []}
            onStarredChange={ids => updateStudy(activeSet.id, 'starred', ids)}
            onMasteredChange={ids => updateStudy(activeSet.id, 'mastered', ids)}
            onBack={() => navigate('set-view')}
          />
        )}
        {currentView === 'learn' && activeSet && (
          <Learn
            key={studyKey + ':' + activeSet.id}
            set={activeSet}
            starredIds={study[activeSet.id]?.starred || []}
            onMasteredChange={ids => updateStudy(activeSet.id, 'mastered', ids, true)}
            onBack={() => navigate('set-view')}
          />
        )}
        {currentView === 'test' && activeSet && (
          <Test
            key={studyKey + ':' + activeSet.id}
            set={activeSet}
            onMasteredChange={ids => updateStudy(activeSet.id, 'mastered', ids, true)}
            onBack={() => navigate('set-view')}
          />
        )}
        {currentView === 'match' && activeSet && (
          <Match key={studyKey + ':' + activeSet.id} set={activeSet} onBack={() => navigate('set-view')} />
        )}
      </main>
    </div>
  );
}

export default App;
