import { FiDatabase, FiDownload, FiTrendingUp, FiBox, FiMapPin, FiRefreshCw } from 'react-icons/fi';
import { sendSecureRequest } from '../../components/SecureToken';
import { useState, useEffect, useCallback } from 'react';
import './css/Backup.css';

const WarehouseAnalytics = () => {
  const adminCode = localStorage.getItem('adminCode');
  const token = sendSecureRequest(adminCode);
  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    abcAnalysis: { A: [], B: [], C: [] },
    inventoryLevels: {},
    eoqData: {},
    turnoverRates: {},
    locationStats: { sources: [], destinations: [] },
    forecasts: {}
  });

  const fetchAnalyticsData = useCallback(async (tab) => {
    try {
      setLoading(true);
      const token = sendSecureRequest(adminCode);
      
      let endpoint = '';
      let dataKey = '';
      
      switch(tab) {
        case 'abc':
          endpoint = '/abc-analysis';
          dataKey = 'abcAnalysis';
          break;
        case 'inventory':
          endpoint = '/inventory-levels';
          dataKey = 'inventoryLevels';
          break;
        case 'eoq':
          endpoint = '/eoq';
          dataKey = 'eoqData';
          break;
        case 'turnover':
          endpoint = '/turnover';
          dataKey = 'turnoverRates';
          break;
        case 'locations':
          endpoint = '/location-stats';
          dataKey = 'locationStats';
          break;
        case 'forecasts':
          endpoint = '/forecast';
          dataKey = 'forecasts';
          break;
        default:
          endpoint = '/update-models';
      }

      const response = await fetch(`https://api.whous.ru/warehouse${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ adminCode })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch ${tab} data`);
      }

      setAnalyticsData(prev => ({
        ...prev,
        [dataKey]: data
      }));
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${tab} data:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminCode]);

  const updateAllModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.whous.ru/warehouse/update-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ adminCode })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update models');
      }

      // Refresh all data after update
      Object.keys(tabs).forEach(tab => fetchAnalyticsData(tab));
    } catch (err) {
      console.error('Error updating models:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData(activeTab);
  }, [activeTab, fetchAnalyticsData]);

  const tabs = {
    inventory: { name: 'Уровни запасов', icon: <FiBox /> },
    abc: { name: 'ABC-анализ', icon: <FiTrendingUp /> },
    eoq: { name: 'EOQ', icon: <FiDatabase /> },
    turnover: { name: 'Оборачиваемость', icon: <FiRefreshCw /> },
    locations: { name: 'Локации', icon: <FiMapPin /> },
    forecasts: { name: 'Прогнозы', icon: <FiTrendingUp /> }
  };

  const renderTabContent = () => {
    if (loading) {
      return <div className="loading-spinner">Загрузка данных...</div>;
    }

    if (error) {
      return (
        <div className="error-message">
          Ошибка: {error}
          <button 
            onClick={() => fetchAnalyticsData(activeTab)}
            className="retry-button"
          >
            Повторить попытку
          </button>
        </div>
      );
    }

    switch(activeTab) {
      case 'abc':
        return (
          <div className="abc-analysis-container">
            <h3>ABC Анализ</h3>
            {['A', 'B', 'C'].map(category => (
              <div key={category} className="abc-category">
                <h4>Категория {category}</h4>
                <div className="abc-products-grid">
                  {analyticsData.abcAnalysis[category]?.map(product => (
                    <div key={product.product_id} className="abc-product-card">
                      <div className="product-name">{product.name}</div>
                      <div className="product-details">
                        <span>Кол-во: {product.quantity}</span>
                        <span>Цена: {product.price}</span>
                        <span>Стоимость: {product.quantity * product.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'inventory':
        return (
          <div className="inventory-levels-container">
            <h3>Оптимальные уровни запасов</h3>
            <div className="inventory-grid">
              {Object.entries(analyticsData.inventoryLevels).map(([productId, data]) => (
                <div key={productId} className="inventory-card">
                  <div className="product-name">{data.productName || `Товар ${productId}`}</div>
                  <div className="inventory-metrics">
                    <div>
                      <label>Точка заказа:</label>
                      <span>{data.reorder_point}</span>
                    </div>
                    <div>
                      <label>Страховой запас:</label>
                      <span>{data.safety_stock}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'eoq':
        return (
          <div className="eoq-container">
            <h3>Экономичный объем заказа (EOQ)</h3>
            <div className="eoq-grid">
              {Object.entries(analyticsData.eoqData).map(([productId, eoq]) => (
                <div key={productId} className="eoq-card">
                  <div className="product-name">{analyticsData.abcAnalysis.find(p => p.product_id === productId)?.name || `Товар ${productId}`}</div>
                  <div className="eoq-value">
                    <label>EOQ:</label>
                    <span>{Math.round(eoq)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'turnover':
        return (
          <div className="turnover-container">
            <h3>Оборачиваемость товаров</h3>
            <div className="turnover-grid">
              {Object.entries(analyticsData.turnoverRates).map(([productId, rate]) => (
                <div key={productId} className="turnover-card">
                  <div className="product-name">{analyticsData.abcAnalysis.find(p => p.product_id === productId)?.name || `Товар ${productId}`}</div>
                  <div className="turnover-rate">
                    <label>Оборачиваемость:</label>
                    <span>{rate.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'locations':
        return (
          <div className="locations-container">
            <div className="location-stats-section">
              <h3>Статистика по исходным локациям</h3>
              <div className="location-stats-grid">
                {analyticsData.locationStats.sources?.map(location => (
                  <div key={location.location} className="location-card">
                    <div className="location-name">{location.location}</div>
                    <div className="location-metrics">
                      <div>Перемещений: {location.transfer_count}</div>
                      <div>Объем: {location.total_quantity}</div>
                      <div>Товаров: {location.unique_products}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="location-stats-section">
              <h3>Статистика по целевым локациям</h3>
              <div className="location-stats-grid">
                {analyticsData.locationStats.destinations?.map(location => (
                  <div key={location.location} className="location-card">
                    <div className="location-name">{location.location}</div>
                    <div className="location-metrics">
                      <div>Перемещений: {location.transfer_count}</div>
                      <div>Объем: {location.total_quantity}</div>
                      <div>Товаров: {location.unique_products}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'forecasts':
        return (
          <div className="forecasts-container">
            <h3>Прогнозы остатков</h3>
            <div className="forecast-grid">
              {Object.entries(analyticsData.forecasts).map(([productId, forecast]) => (
                <div key={productId} className="forecast-card">
                  <div className="product-name">
                    {analyticsData.abcAnalysis.find(p => p.product_id === productId)?.name || `Товар ${productId}`}
                  </div>
                  <div className="forecast-chart">
                    {/* Здесь в будущем будет график или диаграммы */}
                    <div className="forecast-dates">
                      {forecast.map((day, index) => (
                        <div key={index} className="forecast-day">
                          <div>{new Date(day.date).toLocaleDateString()}</div>
                          <div>{day.predicted_quantity.toFixed(0)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return <div>Выберите раздел аналитики</div>;
    }
  };

  return (
    <div className="tab-content">
      <div className="content-header">
        <FiTrendingUp className="header-tab-icon" />
        <h2>Аналитика склада</h2>
        <button 
          onClick={updateAllModels}
          className="update-models-button"
          disabled={loading}
        >
          <FiRefreshCw /> Обновить данные
        </button>
      </div>
      
      <div className="analytics-tabs">
        {Object.entries(tabs).map(([tabKey, tab]) => (
          <button
            key={tabKey}
            className={`tab-button ${activeTab === tabKey ? 'active' : ''}`}
            onClick={() => setActiveTab(tabKey)}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>
      
      <div className="content-card">
        <div className="analytics-container">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default WarehouseAnalytics;
