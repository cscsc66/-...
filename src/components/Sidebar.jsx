import React from 'react';
import { Home as HomeIcon, Library, PlaySquare, Folder, Plus } from 'lucide-react';

function Sidebar({ navigate, currentView }) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => navigate('home')}
        >
          <HomeIcon size={20} /> Дім
        </button>
        
        <button 
          className={`nav-item ${currentView === 'library' ? 'active' : ''}`}
          onClick={() => navigate('library')}
        >
          <Library size={20} /> Ваша бібліотека
        </button>

        <div className="sidebar-divider"></div>
        <div className="nav-section-title">Почніть тут</div>
        
        <button 
          className="nav-item"
          onClick={() => navigate('library')}
        >
          <PlaySquare size={20} /> Картки
        </button>

        <div className="sidebar-divider"></div>
        <div className="nav-section-title">Ваші папки</div>
        
        <button className="nav-item new-folder" onClick={() => alert('Створення папок буде додано незабаром!')}>
          <Plus size={20} /> Нова папка
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
