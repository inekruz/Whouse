import { FiBarChart2, FiPackage, FiTruck, FiTrendingUp, FiClipboard, FiMapPin } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { sendSecureRequest } from '../../components/SecureToken';
import './css/Stats.css';

const Stats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [abcAnalysis, setAbcAnalysis] = useState(null);
  const [transferStats, setTransferStats] = useState(null);
  const [productKPIs, setProductKPIs] = useState({});
  const [locationStats, setLocationStats] = useState({ source: [], destination: [] });
  const [selectedProduct, setSelectedProduct] = useState('');
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('abc');

  const fetchData = async (endpoint, body = {}) => {
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
        body: JSON.stringify({ adminCode, ...body })
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const productsData = await fetchData('products');
      if (productsData) setProducts(productsData.products);
      
      const abcData = await fetchData('abc-analysis');
      if (abcData) setAbcAnalysis(abcData);
      
      const transferData = await fetchData('transfer-stats');
      if (transferData) setTransferStats(transferData);
      
      const sourceLocations = await fetchData('source-location-stats');
      const destLocations = await fetchData('destination-location-stats');
      
      if (sourceLocations) setLocationStats(prev => ({ ...prev, source: sourceLocations }));
      if (destLocations) setLocationStats(prev => ({ ...prev, destination: destLocations }));
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const loadProductKPIs = async () => {
        const kpiData = await fetchData(`full-kpi/${selectedProduct}`);
        if (kpiData) setProductKPIs(prev => ({ ...prev, [selectedProduct]: kpiData }));
      };
      
      loadProductKPIs();
    }
  }, [selectedProduct]);

  const renderAbcAnalysis = () => {
    if (!abcAnalysis) return null;
    
    return (
      <div className="stats-grid">
        {['A', 'B', 'C']?.map(category => (
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
              {abcAnalysis[category]?.map(product => (
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

  const renderInventoryKPIs = () => {
    if (!selectedProduct) {
      return (
        <div className="product-selector">
          <h3>Выберите товар для анализа</h3>
          <select 
            onChange={(e) => setSelectedProduct(e.target.value)}
            value={selectedProduct}
          >
            <option value="">-- Выберите товар --</option>
            {products?.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>
      );
    }

    const kpi = productKPIs[selectedProduct];
    if (!kpi) return <p>Загрузка данных по товару...</p>;

    return (
      <div className="kpi-container">
        <h3>Ключевые показатели товара</h3>
        
        <div className="kpi-grid">
          <div className="kpi-card">
            <FiPackage className="kpi-icon" />
            <h4>Точка заказа</h4>
            <p>{isFinite(kpi.reorder_point) ? Number(kpi.reorder_point).toFixed(2) : 'Н/Д'}</p>
          </div>
          
          <div className="kpi-card">
            <FiClipboard className="kpi-icon" />
            <h4>Страховой запас</h4>
            <p>{Number(kpi.safety_stock)?.toFixed(2) || 'Н/Д'}</p>
          </div>
          
          <div className="kpi-card">
            <FiTrendingUp className="kpi-icon" />
            <h4>Оборачиваемость</h4>
            <p>{Number(kpi.turnover_rate)?.toFixed(2) || Number(kpi.calculatedTurnoverRate)?.toFixed(2) || 'Н/Д'}</p>
          </div>
          
          <div className="kpi-card">
            <FiTruck className="kpi-icon" />
            <h4>EOQ (Оптимальный заказ)</h4>
            <p>{Number(kpi.eoq)?.toFixed(2) || 'Н/Д'}</p>
          </div>
        </div>
        
        <div className="kpi-details">
          <h4>Детали расчета:</h4>
          <div className="detail-row">
            <span>Средний дневной спрос:</span>
            <span>{Number(kpi.demandStats?.avg_daily_demand)?.toFixed(2) || 'Н/Д'}</span>
          </div>
          <div className="detail-row">
            <span>Среднее время поставки (дни):</span>
            <span>{Number(kpi.leadTimeStats?.avg_lead_time)?.toFixed(1) || 'Н/Д'}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderLocationStats = () => {
    return (
      <div className="location-stats">
        <div className="location-tabs">
          <button 
            className={`tab-button ${activeTab === 'source-locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('source-locations')}
          >
            <FiMapPin /> Откуда
          </button>
          <button 
            className={`tab-button ${activeTab === 'dest-locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('dest-locations')}
          >
            <FiMapPin /> Куда
          </button>
        </div>
        
        {activeTab === 'source-locations' ? (
          <div className="location-data">
            <h3>Статистика по источникам</h3>
            {locationStats.source.length === 0 ? (
              <p>Нет данных о перемещениях</p>
            ) : (
              <div className="location-table">
                <div className="location-header">
                  <span>Локация</span>
                  <span>Перемещений</span>
                  <span>Кол-во товаров</span>
                  <span>Уникальных товаров</span>
                </div>
                {locationStats.source?.map(loc => (
                  <div key={loc.location} className="location-row">
                    <span>{loc.location}</span>
                    <span>{loc.transfer_count}</span>
                    <span>{loc.total_quantity}</span>
                    <span>{loc.unique_products}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="location-data">
            <h3>Статистика по назначениям</h3>
            {locationStats.destination.length === 0 ? (
              <p>Нет данных о перемещениях</p>
            ) : (
              <div className="location-table">
                <div className="location-header">
                  <span>Локация</span>
                  <span>Перемещений</span>
                  <span>Кол-во товаров</span>
                  <span>Уникальных товаров</span>
                </div>
                {locationStats.destination.map(loc => (
                  <div key={loc.location} className="location-row">
                    <span>{loc.location}</span>
                    <span>{loc.transfer_count}</span>
                    <span>{loc.total_quantity}</span>
                    <span>{loc.unique_products}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'abc':
        return renderAbcAnalysis();
      case 'transfers':
        return renderTransferStats();
      case 'kpi':
        return renderInventoryKPIs();
      case 'locations':
        return renderLocationStats();
      default:
        return null;
    }
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
          >
            <FiBarChart2 /> ABC-анализ
          </button>
          <button 
            className={`tab-button ${activeTab === 'transfers' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfers')}
          >
            <FiTruck /> Перемещения
          </button>
          <button 
            className={`tab-button ${activeTab === 'kpi' ? 'active' : ''}`}
            onClick={() => setActiveTab('kpi')}
          >
            <FiTrendingUp /> KPI товаров
          </button>
          <button 
            className={`tab-button ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            <FiMapPin /> Локации
          </button>
        </div>
        
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Stats;
