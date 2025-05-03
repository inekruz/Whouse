import { useState, useEffect } from 'react';
import { FiSun, FiMoon, FiSettings, FiLogOut } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import './css/Header.css';

const Header = ({ onAuthClick }) => {
  const [theme, setTheme] = useState('dark');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('admtkn');
    
    setIsAuthenticated(!!token);
    setIsAdmin(!!adminToken);
  }, []);

  const handleLogout = () => {
    if (isAdmin) {
      localStorage.removeItem('admtkn');
      setIsAdmin(false);
      navigate('/admin');
    } else {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      navigate('/');
    }
  };

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
        {isAdmin ? (
          <Link to="/admin/dashboard" className="admin-link">
            <FiSettings size={20} />
          </Link>
        ) : (
          <Link to="/admin" className="admin-link">
            <FiSettings size={20} />
          </Link>
        )}
        {(isAuthenticated || isAdmin) ? (
          <button className="auth-button" onClick={handleLogout}>
            <FiLogOut size={22} /> Выйти
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