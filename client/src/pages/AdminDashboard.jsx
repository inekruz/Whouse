import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiUsers, FiClock, FiDatabase, FiBarChart2 } from 'react-icons/fi';
import Users from './board/Users';
import History from './board/History';
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <Users />;
      case 'history':
        return <History />;
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
            className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FiClock className="nav-icon" />
            <span>История</span>
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
        
      </div>
      
      <div className="admin-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;