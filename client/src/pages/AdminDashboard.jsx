import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiUsers, FiSettings, FiDatabase, FiBarChart2, FiLogOut, FiHome } from 'react-icons/fi';
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
        return (
          <div className="tab-content">
            <h2>Управление пользователями</h2>
            <div className="content-card">
              <p>Здесь будет интерфейс для управления пользователями системы</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="tab-content">
            <h2>Настройки системы</h2>
            <div className="content-card">
              <p>Здесь будут настройки конфигурации системы</p>
            </div>
          </div>
        );
      case 'backup':
        return (
          <div className="tab-content">
            <h2>Резервное копирование</h2>
            <div className="content-card">
              <p>Здесь будет управление резервными копиями</p>
            </div>
          </div>
        );
      case 'stats':
        return (
          <div className="tab-content">
            <h2>Статистика системы</h2>
            <div className="content-card">
              <p>Здесь будет аналитика и статистика работы системы</p>
            </div>
          </div>
        );
      default:
        return null;
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
        <div className="content-header">
          <h2>
            {activeTab === 'users' && <FiUsers className="header-tab-icon" />}
            {activeTab === 'settings' && <FiSettings className="header-tab-icon" />}
            {activeTab === 'backup' && <FiDatabase className="header-tab-icon" />}
            {activeTab === 'stats' && <FiBarChart2 className="header-tab-icon" />}
            {renderTabContent().props.children[0]}
          </h2>
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;