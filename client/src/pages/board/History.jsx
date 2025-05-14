import { useState, useEffect } from 'react';
import { FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { sendSecureRequest } from '../../components/SecureToken';
import './css/History.css';

const Settings = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const adminCode = localStorage.getItem('adminCode');
  const token = sendSecureRequest(adminCode);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/whistory/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({ adminCode })
        });

        if (!response.ok) {
          throw new Error('Ошибка при загрузке истории');
        }

        const data = await response.json();
        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token, adminCode]);

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
    setHistory(history.map(item => 
      item.id === id ? { ...item, showDescription: !item.showDescription } : item
    ));
  };

  if (loading) {
    return (
      <div className="tab-content">
        <div className="content-header">
          <FiClock className="header-tab-icon" />
          <h2>История работы склада</h2>
        </div>
        <div className="content-card">
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
        <div className="content-card">
          <p className="error-message">{error}</p>
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
          <p>Нет данных о работе склада</p>
        ) : (
          <div className="history-list">
            {history.map(item => (
              <div key={item.id} className="history-item">
                <div className="history-item-header">
                  <div className="user-info">
                    <span className="username">{item.username || 'Неизвестный пользователь'}</span>
                    <span className="timestamp">{formatDate(item.created_at)}</span>
                  </div>
                  <button 
                    onClick={() => toggleDescription(item.id)}
                    className="toggle-description"
                  >
                    {item.showDescription ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
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

export default Settings;