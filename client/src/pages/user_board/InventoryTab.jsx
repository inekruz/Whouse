import { useState, useEffect } from 'react';
import { sendSecureRequest } from '../../components/SecureToken';
import '../css/Dashboard.css';

const BASE_URL = 'https://api.whous.ru/inv';
const user_code = localStorage.getItem('dnum');

const InventoryModule = () => {
  const [inventoryData, setInventoryData] = useState({
    stock: [],
    transfers: [],
    inventoryChecks: []
  });
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('stock');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = await sendSecureRequest(user_code);
        
        // Запрос для получения товаров
        const stockResponse = await fetch(`${BASE_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': authToken
          },
          body: JSON.stringify({ user_code })
        });
        const stockData = await stockResponse.json();
        
        // Запрос для получения перемещений
        const transfersResponse = await fetch(`${BASE_URL}/transfers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': authToken
          },
          body: JSON.stringify({ user_code })
        });
        const transfersData = await transfersResponse.json();
        
        // Запрос для получения инвентаризаций
        const inventoryResponse = await fetch(`${BASE_URL}/inventory-checks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': authToken
          },
          body: JSON.stringify({ user_code })
        });
        const inventoryData = await inventoryResponse.json();

        setInventoryData({
          stock: stockData,
          transfers: transfersData,
          inventoryChecks: inventoryData
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="tab-content">Загрузка данных...</div>;
  }

  return (
    <div className="tab-content">
      <h2 className="tab-title">Управление запасами</h2>
      
      <div className="module-navigation">
        <button 
          className={`module-nav-button ${activeView === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveView('stock')}
        >
          Остатки товаров
        </button>
        <button 
          className={`module-nav-button ${activeView === 'transfers' ? 'active' : ''}`}
          onClick={() => setActiveView('transfers')}
        >
          Перемещение товаров
        </button>
        <button 
          className={`module-nav-button ${activeView === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveView('inventory')}
        >
          Инвентаризация
        </button>
      </div>
      
      <div className="module-content">
        {activeView === 'stock' && <StockView data={inventoryData.stock} />}
        {activeView === 'transfers' && <TransfersView data={inventoryData.transfers} />}
        {activeView === 'inventory' && <InventoryCheckView data={inventoryData.inventoryChecks} />}
      </div>
    </div>
  );
};

// Компонент для отображения остатков товаров
const StockView = ({ data }) => {
  return (
    <div className="data-section">
      <h3 className="section-title">Текущие остатки</h3>
      <div className="data-table">
        <div className="table-header">
          <div className="table-cell">Товар</div>
          <div className="table-cell">Количество</div>
          <div className="table-cell">Местоположение</div>
        </div>
        {data.map(item => (
          <div key={item.id} className="table-row">
            <div className="table-cell">{item.name}</div>
            <div className="table-cell">{item.quantity}</div>
            <div className="table-cell">{item.location}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Компонент для отображения перемещений товаров
const TransfersView = ({ data }) => {
  return (
    <div className="data-section">
      <h3 className="section-title">История перемещений</h3>
      <div className="data-table">
        <div className="table-header">
          <div className="table-cell">Товар</div>
          <div className="table-cell">Откуда</div>
          <div className="table-cell">Куда</div>
          <div className="table-cell">Дата</div>
          <div className="table-cell">Статус</div>
        </div>
        {data.map(item => (
          <div key={item.id} className="table-row">
            <div className="table-cell">{item.product}</div>
            <div className="table-cell">{item.from}</div>
            <div className="table-cell">{item.to}</div>
            <div className="table-cell">{item.date}</div>
            <div className="table-cell">
              <span className={`status-badge ${item.status === 'Завершено' ? 'success' : 'warning'}`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Компонент для отображения инвентаризаций
const InventoryCheckView = ({ data }) => {
  return (
    <div className="data-section">
      <h3 className="section-title">История инвентаризаций</h3>
      <div className="data-cards">
        {data.map(item => (
          <div key={item.id} className="data-card">
            <div className="card-header">
              <h4>Инвентаризация #{item.id}</h4>
              <span className={`status-badge ${item.discrepancies === 0 ? 'success' : 'danger'}`}>
                {item.discrepancies === 0 ? 'Без расхождений' : `${item.discrepancies} расхождений`}
              </span>
            </div>
            <div className="card-body">
              <div className="card-row">
                <span>Дата:</span>
                <span>{item.date}</span>
              </div>
              <div className="card-row">
                <span>Проверено позиций:</span>
                <span>{item.itemsChecked}</span>
              </div>
              <div className="card-row">
                <span>Статус:</span>
                <span>{item.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryModule;