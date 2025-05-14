import { FiBarChart2 } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { sendSecureRequest } from '../../components/SecureToken';
import './css/Stats.css';

const Stats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [abcAnalysis, setAbcAnalysis] = useState(null);
  const [transferStats, setTransferStats] = useState(null);
  const [activeTab, setActiveTab] = useState('abc');

  const fetchData = async (endpoint) => {
    try {
      setLoading(true);
      setError(null);
      
      const adminCode = localStorage.getItem('adminCode');
      const token = sendSecureRequest(adminCode);
      
      const response = await fetch(`https://api.whous.ru/math/${endpoint}`, {
        method: 'POST',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminCode })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const abcData = await fetchData('abc-analysis');
      if (abcData) setAbcAnalysis(abcData);
      
      const transferData = await fetchData('transfer-stats');
      if (transferData) setTransferStats(transferData);
    };
    
    loadData();
  }, []);

  const renderAbcAnalysis = () => {
    if (!abcAnalysis) return null;
    
    return (
      <div className="stats-grid">
        {['A', 'B', 'C'].map(category => (
          <div key={category} className="stats-category">
            <h3 style={{ color: `var(--${category === 'A' ? 'danger' : category === 'B' ? 'warning' : 'success'}-color)` }}>
              Категория {category}
            </h3>
            <div className="stats-table">
              <div className="stats-table-header">
                <span>Товар</span>
                <span>Кол-во</span>
                <span>Цена</span>
                <span>Стоимость</span>
              </div>
              {abcAnalysis[category].map(product => (
                <div key={product.product_id} className="stats-table-row">
                  <span>{product.name}</span>
                  <span>{product.quantity}</span>
                  <span>{Number(product.price).toFixed(2)}</span>
                  <span>{(Number(product.quantity) * Number(product.price)).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

const renderTransferStats = () => {
  if (!transferStats) return <p>Данные о перемещениях не загружены</p>;
  
  return (
    <div className="transfer-stats">
      <h3>Анализ перемещений (90 дней)</h3>
      {transferStats.totalTransfers === 0 ? (
        <p>Нет данных о перемещениях за последние 90 дней</p>
      ) : (
        <div className="transfer-grid">
          <div className="transfer-card" style={{ backgroundColor: 'var(--secondary-color)' }}>
            <h4>Всего перемещений</h4>
            <p style={{ color: 'var(--link-color)', fontSize: '1.5rem' }}>
              {transferStats.totalTransfers || 0}
            </p>
          </div>
          <div className="transfer-card" style={{ backgroundColor: 'var(--secondary-color)' }}>
            <h4>Среднее в день</h4>
            <p style={{ color: 'var(--success-color)', fontSize: '1.5rem' }}>
              {(transferStats.avgPerDay || 0).toFixed(1)}
            </p>
          </div>
          <div className="transfer-card" style={{ backgroundColor: 'var(--secondary-color)' }}>
            <h4>Самый активный товар</h4>
            <p style={{ color: 'var(--warning-color)', fontSize: '1.2rem' }}>
              {transferStats.mostActiveProduct?.name || 'Нет данных'}
            </p>
            <p>Перемещений: {transferStats.mostActiveProduct?.count || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};

  return (
    <div className="tab-content">
      <div className="content-header">
        <FiBarChart2 className="header-tab-icon" />
        <h2>Статистика системы</h2>
      </div>
      
      <div className="content-card stats-container">
        {loading && <p className="loading-text">Загрузка данных...</p>}
        {error && <p className="error-text" style={{ color: 'var(--danger-color)' }}>{error}</p>}
        
        <div className="stats-tabs">
          <button 
            className={`tab-button ${activeTab === 'abc' ? 'active' : ''}`}
            onClick={() => setActiveTab('abc')}
            style={{
              backgroundColor: activeTab === 'abc' ? 'var(--button-color)' : 'var(--quaternary-color)'
            }}
          >
            ABC-анализ
          </button>
          <button 
            className={`tab-button ${activeTab === 'transfers' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfers')}
            style={{
              backgroundColor: activeTab === 'transfers' ? 'var(--button-color)' : 'var(--quaternary-color)'
            }}
          >
            Перемещения
          </button>
        </div>
        
        {activeTab === 'abc' ? renderAbcAnalysis() : renderTransferStats()}
      </div>
    </div>
  );
};

export default Stats;