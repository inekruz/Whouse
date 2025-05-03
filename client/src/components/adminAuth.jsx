import { useState } from 'react';
import { FiLock, FiUser, FiKey, FiLogIn, FiUserPlus, FiX } from 'react-icons/fi';
import { sendSecureRequest } from './SecureToken';
import { useNavigate } from 'react-router-dom';
import Notification from './Notification';
import { showMsg } from './Notification';
import './css/AdminAuth.css';

const AdminAuth = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    confirmPassword: '',
    adminCode: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin && formData.password !== formData.confirmPassword) {
      showMsg('Пароли не совпадают!', 'error');
      return;
    }
  
    const token = sendSecureRequest(formData.adminCode);
    const endpoint = isLogin ? '/get' : '/register';
    
    try {
      const response = await fetch(`https://api.whous.ru/adm${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          login: formData.login,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          adminCode: formData.adminCode
        })
      });
  
      const data = await response.json();
      if (!response.ok) {
        showMsg('Ошибка при выполнении запроса', 'error');
      }
  
      if (data.token) {
        localStorage.setItem('admtkn', data.token);
        localStorage.setItem('adminCode', data.adminCode);
        navigate('/admin/dashboard');
      }
  
      showMsg('Вход выполнен успешно!', 'success');
      onClose();
    } catch (error) {
      console.error('Error:', error);
      showMsg('Произошла ошибка', 'error');
    }
  };

  return (
    <div className="admin-auth-modal">
            <Notification />
      <div className="admin-auth-content">
        <button className="admin-auth-close" onClick={onClose}>
          <FiX />
        </button>
        <h2 className="admin-auth-title">
          <FiLock className="icon" /> 
          {isLogin ? 'Административный вход' : 'Регистрация администратора'}
        </h2>
        <div className="auth-mode-switcher">
          <div className={`auth-mode-tabs ${isLogin ? 'login-active' : 'register-active'}`}>
            <button
              type="button"
              className={`auth-mode-tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              <FiLogIn className="icon" />
              <span>Вход</span>
            </button>
            <div className="auth-mode-slider"></div>
            <button
              type="button"
              className={`auth-mode-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              <FiUserPlus className="icon" />
              <span>Регистрация</span>
            </button>
          </div>
        </div>
        <form className="admin-auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login">
              <FiUser className="icon" /> Логин
            </label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              <FiKey className="icon" /> Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <FiKey className="icon" /> Повтор пароля
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="adminCode">
              <FiLock className="icon" /> Код администратора
            </label>
            <input
              type="password"
              id="adminCode"
              name="adminCode"
              value={formData.adminCode}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="admin-auth-submit">
            {isLogin ? (
              <>
                <FiLogIn className="icon" /> Войти
              </>
            ) : (
              <>
                <FiUserPlus className="icon" /> Зарегистрироваться
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAuth;