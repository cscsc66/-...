import React, { useState } from 'react';
import { UserPlus, LogIn, X } from 'lucide-react';

function Auth({ onLogin, onCancel }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Заповніть всі поля');
      return;
    }

    const usersStr = localStorage.getItem('marusya-users');
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (isLogin) {
      if (users[username] && users[username].password === password) {
        onLogin({ username, name: users[username].name || username });
      } else {
        setError('Невірний логін або пароль');
      }
    } else {
      if (users[username]) {
        setError('Користувач з таким логіном вже існує');
      } else {
        const newUser = { username, password, name: username, createdAt: new Date().toISOString() };
        users[username] = newUser;
        localStorage.setItem('marusya-users', JSON.stringify(users));
        onLogin({ username, name: username });
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button className="btn-icon auth-close" onClick={onCancel}><X size={24} /></button>
        <h2>{isLogin ? 'Вхід' : 'Реєстрація'}</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Логін"
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Пароль"
            />
          </div>
          
          <button type="submit" className="btn primary full-width">
            {isLogin ? <><LogIn size={20} /> Увійти</> : <><UserPlus size={20} /> Зареєструватися</>}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? 'Немає акаунту?' : 'Вже є акаунт?'}
          <button className="btn-text" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Створити' : 'Увійти'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;
