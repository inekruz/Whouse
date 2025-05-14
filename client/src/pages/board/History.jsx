import { useState, useEffect, useCallback } from 'react';
import { FiClock, FiChevronDown, FiChevronUp, FiRefreshCw } from 'react-icons/fi';
import { sendSecureRequest } from '../../components/SecureToken';
import './css/History.css';

const Settings = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchHistory = useCallback(async () => {
    try {
      const adminCode = localStorage.getItem('adminCode');
      if (!adminCode) {
        throw new Error('Не найден adminCode в localStorage');
      }
      
      const token = sendSecureRequest(adminCode);
      if (!token) {
        throw new Error('Ошибка создания токена');
      }

      setLoading(true);
      setError(null);

      const response = await fetch('https://api.whous.ru/history/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ adminCode })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Ошибка при загрузке истории');
      }

      const data = await response.json();
      setHistory(data.map(item => ({ ...item, showDescription: false })));
    } catch (err) {
      console.error('Fetch history error:', err);
      setError(err.message || 'Произошла неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleDescription = (id) => {
    setHistory(prev => prev.map(item => 
      item.id === id ? { ...item, showDescription: !item.showDescription } : item
    ));
  };

  if (loading && history.length === 0) {
    return (
      <div className="tab-content">
        <div className="content-header">
          <FiClock className="header-tab-icon" />
          <h2>История работы склада</h2>
        </div>
        <div className="content-card loading-card">
          <FiRefreshCw className="spinner" />
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tab-content">
        <div className="content-header">
          <FiClock className="header-tab-icon" />
          <h2>История работы склада</h2>
        </div>
        <div className="content-card error-card">
          <p className="error-message">{error}</p>
          <button 
            onClick={fetchHistory}
            className="retry-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <FiRefreshCw className="spinner" />
                Загрузка...
              </>
            ) : 'Повторить попытку'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="content-header">
        <FiClock className="header-tab-icon" />
        <h2>История работы склада</h2>
      </div>
      
      <div className="content-card">

        {history.length === 0 ? (
          <p className="empty-message">Нет данных о работе склада</p>
        ) : (
          <div className="history-list">
            {history.map(item => (
              <div key={item.id} className="history-item">
                <div 
                  className="history-item-header"
                  onClick={() => toggleDescription(item.id)}
                >
                  <div className="user-info">
                    <span className="username">{item.username || 'Неизвестный пользователь'}</span>
                    <span className="action-type">{getActionType(item.description)}</span>
                    <span className="timestamp">{formatDate(item.created_at)}</span>
                  </div>
                  <div className="toggle-description">
                    {item.showDescription ? <FiChevronUp /> : <FiChevronDown />}
                  </div>
                </div>
                
                {item.showDescription && (
                  <div className="history-description">
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Вспомогательная функция для определения типа действия
function getActionType(description) {
  if (description.includes('Изменил товар')) return 'Изменение товара';
  if (description.includes('Добавил товар')) return 'Добавление товара';
  if (description.includes('Приемка товара')) return 'Приемка';
  if (description.includes('Отгрузка товара')) return 'Отгрузка';
  return 'Действие';
}

export default Settings;