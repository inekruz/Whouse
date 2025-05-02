import { useState, useEffect } from 'react';
import { FiSun, FiMoon, FiSettings, FiLogOut } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import './css/Header.css';

const Header = ({ onAuthClick }) => {
  const [theme, setTheme] = useState('dark');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <header className="header">
      <Link to="/" className="header__logo">
        <span className="header__logo-text">WHOUSE</span>
      </Link>
      <div className="header__controls">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>
        <Link to="/admin" className="admin-link">
          <FiSettings size={20} />
        </Link>
        {isAuthenticated ? (
          <button className="auth-button" onClick={handleLogout}>
            <FiLogOut size={20} /> Выйти
          </button>
        ) : (
          <button className="auth-button" onClick={onAuthClick}>
            Войти
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;