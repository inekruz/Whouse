import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Notification from './Notification';
import { showMsg } from './Notification';
import './css/Auth.css';

const Auth = ({ onClose }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://api.whous.ru/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login,
          password,
          user_code: code
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showMsg('Ошибка авторизации', 'error');
      }

      localStorage.setItem('token', data.token);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      showMsg(`${err.message}`, 'error');
    }
  };

  return (
    <div className="auth-modal">
      <Notification />
      <div className="auth-content">
        <button className="auth-close" onClick={onClose}>
          &times;
        </button>
        <h2>Авторизация</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login">Логин</label>
            <input 
              type="text" 
              id="login" 
              placeholder="Введите ваш логин" 
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Введите пароль" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="code">Код-Сотрудника</label>
            <input 
              type="number" 
              id="code" 
              placeholder="Введите ваш код" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <button type="submit" className="auth-submit">
            Войти
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;