import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './style/colors.css';
import Header from './components/Header';
import Auth from './components/Auth';
import AdminAuth from './components/adminAuth';
import { FiDatabase, FiUsers, FiAlertTriangle, FiKey, FiShield, FiPackage, FiBarChart2, FiEdit, FiLock } from 'react-icons/fi';

const MainPage = () => {
  return (
    <div className="page-container">
      <div className="hero-section">
        <h1 className="hero-title">WHOUSE - Управление складом</h1>
        <p className="hero-subtitle">(АРМ) Автоматизированное рабочее место работников склада</p>
      </div>

      <div className="features-container">
        <div className="feature-card">
          <FiDatabase className="feature-icon" />
          <h3>Централизованная база данных</h3>
          <p>Все товары на складе в одной системе с актуальной информацией</p>
        </div>
        
        <div className="feature-card">
          <FiPackage className="feature-icon" />
          <h3>Управление товарами</h3>
          <p>Добавляйте, удаляйте и обновляйте информацию о товарах</p>
        </div>
        
        <div className="feature-card">
          <FiBarChart2 className="feature-icon" />
          <h3>Статистика и аналитика</h3>
          <p>Просматривайте остатки товаров и анализируйте движение склада</p>
        </div>
      </div>

      <div className="info-section">
        <div className="info-card warning-card">
          <FiAlertTriangle className="warning-icon" />
          <h3>Важная информация</h3>
          <p>Для получения доступа обратитесь к администратору</p>
          <a 
            href="https://t.me/inekruz" 
            className="admin-button"
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FiUsers /> Связаться с администратором
          </a>
        </div>

        <div className="info-card security-card">
          <div className="security-item">
            <FiShield className="security-icon" />
            <p>Не передавайте свои данные третьим лицам!</p>
          </div>
          <div className="security-item">
            <FiKey className="security-icon" />
            <p>При утере данных немедленно сообщите администратору</p>
          </div>
          <div className="security-item">
            <FiEdit className="security-icon" />
            <p>Нарушение правил безопасности приведет к увольнению</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPage = ({ onAdminAuthClick }) => {
  return (
    <div className="admin-page">
      <div className="admin-container">
        <FiLock className="admin-icon" size={40} />
        <h2>Административная панель</h2>
        <p>Для доступа к административным функциям требуется авторизация</p>
        <button 
          className="admin-access-button"
          onClick={onAdminAuthClick}
        >
          <FiKey /> Открыть административный вход
        </button>
      </div>
    </div>
  );
};

function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);

  return (
    <Router>
      <div className="App">
        <Header 
          onAuthClick={() => setShowAuth(true)} 
          onAdminClick={() => setShowAdminAuth(true)}
        />
        
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route 
            path="/admin" 
            element={<AdminPage onAdminAuthClick={() => setShowAdminAuth(true)} />} 
          />
        </Routes>

        {showAuth && <Auth onClose={() => setShowAuth(false)} />}
        {showAdminAuth && <AdminAuth onClose={() => setShowAdminAuth(false)} />}
      </div>
    </Router>
  );
}

export default App;