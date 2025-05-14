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
  const [showAddForm, setShowAddForm] = useState(false);

  // Функция для загрузки данных
  const fetchData = async () => {
    try {
      const authToken = sendSecureRequest(user_code);
      const authToken2 = sendSecureRequest(user_code);
      const authToken3 = sendSecureRequest(user_code);
      
      const [stockResponse, transfersResponse, inventoryResponse] = await Promise.all([
        fetch(`${BASE_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': authToken
          },
          body: JSON.stringify({ user_code })
        }),
        fetch(`${BASE_URL}/transfers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': authToken2
          },
          body: JSON.stringify({ user_code })
        }),
        fetch(`${BASE_URL}/inventory-checks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': authToken3
          },
          body: JSON.stringify({ user_code })
        })
      ]);

      const [stockData, transfersData, inventoryData] = await Promise.all([
        stockResponse.json(),
        transfersResponse.json(),
        inventoryResponse.json()
      ]);

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

  useEffect(() => {
    fetchData();
  }, []);

  // Функция для добавления нового элемента
  const handleAddItem = async (type, data) => {
    try {
      const authToken = await sendSecureRequest(user_code);
      
      const response = await fetch(`${BASE_URL}/${type}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({ user_code, ...data })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сервера');
      }

      await fetchData();
      return await response.json();
    } catch (error) {
      console.error('Error adding item:', error);
      alert(`Ошибка: ${error.message}`);
      throw error;
    }
  };

  if (loading) {
    return <div className="tab-content">Загрузка данных...</div>;
  }

  return (
    <div className="tab-content">
      <h2 className="tab-title">Управление запасами</h2>
      
      <div className="module-navigation">
        <button 
          className={`module-nav-button ${activeView === 'stock' ? 'active' : ''}`}
          onClick={() => { setActiveView('stock'); setShowAddForm(false); }}
        >
          Остатки товаров
        </button>
        <button 
          className={`module-nav-button ${activeView === 'transfers' ? 'active' : ''}`}
          onClick={() => { setActiveView('transfers'); setShowAddForm(false); }}
        >
          Перемещение товаров
        </button>
        <button 
          className={`module-nav-button ${activeView === 'inventory' ? 'active' : ''}`}
          onClick={() => { setActiveView('inventory'); setShowAddForm(false); }}
        >
          Инвентаризация
        </button>
      </div>
      
      <div className="module-actions">
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Отменить' : 'Добавить'}
        </button>
      </div>
      
      <div className="module-content">
        {showAddForm && (
          <AddForm 
            type={activeView} 
            onAdd={handleAddItem} 
            products={inventoryData.stock}
          />
        )}
        
        {activeView === 'stock' && <StockView data={inventoryData.stock} />}
        {activeView === 'transfers' && <TransfersView data={inventoryData.transfers} />}
        {activeView === 'inventory' && <InventoryCheckView data={inventoryData.inventoryChecks} />}
      </div>
    </div>
  );
};

// Компонент для отображения остатков товаров
const StockView = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="data-section">
        <h3 className="section-title">Текущие остатки</h3>
        <div className="empty-message">Пусто</div>
      </div>
    );
  }

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
  if (!data || data.length === 0) {
    return (
      <div className="data-section">
        <h3 className="section-title">История перемещений</h3>
        <div className="empty-message">Пусто</div>
      </div>
    );
  }

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
  if (!data || data.length === 0) {
    return (
      <div className="data-section">
        <h3 className="section-title">История инвентаризаций</h3>
        <div className="empty-message">Пусто</div>
      </div>
    );
  }

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

const AddForm = ({ type, onAdd, products }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    from_location: '',
    to_location: '',
    status: 'В процессе'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.product_id) {
      alert('Пожалуйста, выберите товар');
      return;
    }

    try {
      await onAdd(type, formData);
      setFormData({
        product_id: '',
        from_location: '',
        to_location: '',
        status: 'В процессе'
      });
    } catch (error) {
      console.error('Ошибка при добавлении:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (type === 'transfers') {
    return (
      <div className="add-form">
        <h3>Добавить перемещение</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Товар:</label>
            <select 
              name="product_id" 
              required
              value={formData.product_id}
              onChange={handleChange}
            >
              <option value="">Выберите товар</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (ID: {product.id}, Остаток: {product.quantity})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Откуда:</label>
            <input 
              id='input-for'
              type="text" 
              name="from_location" 
              required 
              value={formData.from_location}
              onChange={handleChange}
              placeholder="Например: Секция А1"
            />
          </div>
          
          <div className="form-group">
            <label>Куда:</label>
            <input 
              id='input-for'
              type="text" 
              name="to_location" 
              required 
              value={formData.to_location}
              onChange={handleChange}
              placeholder="Например: Секция B2"
            />
          </div>
          
          <div className="form-group">
            <label>Статус:</label>
            <select 
              name="status" 
              required 
              value={formData.status}
              onChange={handleChange}
            >
              <option value="В процессе">В процессе</option>
              <option value="Завершено">Завершено</option>
            </select>
          </div>
          
          <button type="submit" className="btn-primary">
            Добавить перемещение
          </button>
        </form>
      </div>
    );
  }

if (type === 'inventory') {
  return (
    <div className="add-form">
      <h3>Добавить инвентаризацию</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Товар:</label>
          <select 
            name="product_id" 
            required
            value={formData.product_id || ''}
            onChange={handleChange}
          >
            <option value="">Выберите товар</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} (ID: {product.id}, Остаток: {product.quantity})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Проверено позиций:</label>
          <input 
          id='input-for'
            type="number" 
            name="items_checked" 
            required 
            min="1"
            value={formData.items_checked || ''}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Расхождения:</label>
          <input 
          id='input-for'
            type="number" 
            name="discrepancies" 
            required 
            min="0"
            value={formData.discrepancies || ''}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Статус:</label>
          <select 
            name="status" 
            required 
            value={formData.status || 'В процессе'}
            onChange={handleChange}
          >
            <option value="В процессе">В процессе</option>
            <option value="Завершено">Завершено</option>
          </select>
        </div>
        
        <button type="submit" className="btn-primary">Добавить</button>
      </form>
    </div>
  );
}

  return null;
};

export default InventoryModule;