import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiUsers, FiSettings, FiDatabase, FiBarChart2, FiLogOut, FiHome } from 'react-icons/fi';
import Users from './board/Users';
import Settings from './board/Settings';
import Backup from './board/Backup';
import Stats from './board/Stats';
import './css/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const adminToken = localStorage.getItem('admtkn');
    if (!adminToken) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admtkn');
    navigate('/admin');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <Users />;
      case 'settings':
        return <Settings />;
      case 'backup':
        return <Backup />;
      case 'stats':
        return <Stats />;
      default:
        return <Users />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <FiLock className="header-icon" />
          <h1>Админ-панель</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers className="nav-icon" />
            <span>Пользователи</span>
          </button>
          
          <button 
            className={`nav-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FiSettings className="nav-icon" />
            <span>Настройки</span>
          </button>
          
          <button 
            className={`nav-button ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            <FiDatabase className="nav-icon" />
            <span>Резервные копии</span>
          </button>
          
          <button 
            className={`nav-button ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <FiBarChart2 className="nav-icon" />
            <span>Статистика</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <button className="home-button" onClick={() => navigate('/')}>
            <FiHome className="nav-icon" />
            <span>На главную</span>
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <FiLogOut className="nav-icon" />
            <span>Выйти</span>
          </button>
        </div>
      </div>
      
      <div className="admin-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;