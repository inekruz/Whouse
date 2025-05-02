import { useState, useEffect } from 'react';
import { FiSun, FiMoon, FiSettings } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './css/Header.css';

const Header = ({ onAuthClick }) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
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
        <button className="auth-button" onClick={onAuthClick}>
          Войти
        </button>
      </div>
    </header>
  );
};

export default Header;