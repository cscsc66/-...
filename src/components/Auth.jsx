import { useState } from 'react';
import { readStored, writeStored, isRecord } from '../utils/storage';
import { hashPassword, verifyPassword } from '../utils/password';
import { UserPlus, LogIn, X } from 'lucide-react';

function Auth({ onLogin, onCancel }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    const login = username.trim();
    if (!login || !password.trim()) {
      setError('Заповніть всі поля');
      return;
    }
    setIsSubmitting(true);
    try {
      const users = readStored('marusya-users', {}, isRecord);
      const user = Object.hasOwn(users, login) && isRecord(users[login]) ? users[login] : null;
      if (isLogin) {
        if (!user || !await verifyPassword(password, user)) {
          setError('Невірний логін або пароль');
          return;
        }
        if (typeof user.password === 'string') {
          const migrated = { ...user, ...await hashPassword(password) };
          delete migrated.password;
          if (!writeStored('marusya-users', { ...users, [login]: migrated })) throw new Error('storage');
        }
        onLogin({ username: login, name: typeof user.name === 'string' ? user.name : login });
      } else {
        if (user) {
          setError('Користувач з таким логіном вже існує');
          return;
        }
        const newUser = { username: login, name: login, createdAt: new Date().toISOString(), ...await hashPassword(password) };
        if (!writeStored('marusya-users', { ...users, [login]: newUser })) throw new Error('storage');
        onLogin({ username: login, name: login });
      }
    } catch {
      setError('Не вдалося зберегти або перевірити облікові дані. Перевірте доступ до сховища та використовуйте HTTPS або localhost.');
    } finally {
      setIsSubmitting(false);
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
          
          <button disabled={isSubmitting} type="submit" className="btn primary full-width">
            {isLogin ? <><LogIn size={20} /> Увійти</> : <><UserPlus size={20} /> Зареєструватися</>}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? 'Немає акаунту?' : 'Вже є акаунт?'}
          <button className="btn-text" disabled={isSubmitting} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Створити' : 'Увійти'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;
