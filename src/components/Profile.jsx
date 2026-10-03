import React from 'react';
import { User, LogOut, Book, ArrowLeft } from 'lucide-react';

function Profile({ user, sets, onLogout, navigate }) {
  const userSets = sets.filter(s => s.authorId === user.username);

  return (
    <div className="profile-container">
      <div className="mode-header">
        <button className="btn-back" onClick={() => navigate('home')}><ArrowLeft size={24} /> Назад</button>
        <h2>Особистий кабінет</h2>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          <User size={64} color="#fb6f92" />
        </div>
        <div className="profile-info">
          <h3>{user.name}</h3>
          <p>@{user.username}</p>
        </div>
        <button className="btn secondary logout-btn" onClick={onLogout}>
          <LogOut size={20} /> Вийти
        </button>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <Book size={32} color="#fb6f92" />
          <div className="stat-details">
            <h4>Створено наборів</h4>
            <span>{userSets.length}</span>
          </div>
        </div>
      </div>

      <div className="profile-sets">
        <h3>Ваші набори</h3>
        {userSets.length === 0 ? (
          <p className="empty-state">Ви ще не створили жодного набору.</p>
        ) : (
          <div className="sets-grid">
            {userSets.map(set => (
              <div key={set.id} className="set-card" onClick={() => navigate('set-view', set.id)}>
                <div className="set-card-content">
                  <h3>{set.title}</h3>
                  <p>{set.description}</p>
                  <span className="card-count">{set.cards.length} термінів</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
