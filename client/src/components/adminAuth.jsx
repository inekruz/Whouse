import { useState } from 'react';
import { FiLock, FiUser, FiKey, FiLogIn } from 'react-icons/fi';
import './css/AdminAuth.css';

const AdminAuth = ({ onClose }) => {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    confirmPassword: '',
    adminCode: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Здесь будет логика проверки и входа
    console.log('Admin login attempt:', formData);
  };

  return (
    <div className="admin-auth-modal">
      <div className="admin-auth-content">
        <button className="admin-auth-close" onClick={onClose}>
          &times;
        </button>
        <h2 className="admin-auth-title">
          <FiLock className="icon" /> Административный вход
        </h2>
        
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
              required
            />
          </div>
          
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
            <FiLogIn className="icon" /> Войти как администратор
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAuth;