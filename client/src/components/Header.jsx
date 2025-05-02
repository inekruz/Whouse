import { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
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
      <div className="header__logo">WHOUSE</div>
      <div className="header__controls">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>
        <button className="auth-button" onClick={onAuthClick}>
          Войти
        </button>
      </div>
    </header>
  );
};

export default Header;