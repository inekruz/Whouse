import { useState, useEffect } from 'react';
import Notification, { showMsg } from '../../components/Notification';
import { sendSecureRequest } from '../../components/SecureToken';
import '../css/Dashboard.css';

const API_BASE_URL = 'https://api.whous.ru/shp/';
const user_code = localStorage.getItem('dnum');

const ShippingTab = () => {
  const [activeTab, setActiveTab] = useState('receiving');
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    batchNumber: '',
    serialNumbers: '',
    supplier: '',
    invoiceNumber: '',
    recipient: '',
    shippingDate: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);

// Загрузка данных с сервера
useEffect(() => {
  const fetchData = async () => {
    try {
      const token = sendSecureRequest(user_code);
      
      // Загрузка товаров
      const productsResponse = await fetch(`${API_BASE_URL}products`, {
        method: 'POST', // Изменил на POST чтобы можно было передать body
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_code })
      });
      const productsData = await productsResponse.json();
      setProducts(productsData);
      
      // Загрузка категорий
      const categoriesResponse = await fetch(`${API_BASE_URL}categories`, {
        method: 'POST',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_code })
      });
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData);
      
      // Загрузка партий
      const batchesResponse = await fetch(`${API_BASE_URL}batches`, {
        method: 'POST',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_code })
      });
      const batchesData = await batchesResponse.json();
      setBatches(batchesData);
      
    } catch (error) {
      showMsg('Ошибка загрузки данных', 'error');
      console.error('Error fetching data:', error);
    }
  };
  
  fetchData();
}, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSerialNumbers = () => {
    const serials = formData.serialNumbers.split('\n').filter(sn => sn.trim() !== '');
    setFormData(prev => ({
      ...prev,
      serialNumbers: serials
    }));
  };

// Обработчик приемки товара
const handleReceiveProduct = async (e) => {
  e.preventDefault();
  
  try {
    const token = sendSecureRequest(user_code);
    const response = await fetch(`${API_BASE_URL}receive`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...formData,
        user_code,
        quantity: parseInt(formData.quantity)
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      setBatches(prev => [...prev, result.batch]);
      setProducts(prev => prev.map(p => 
        p.id === formData.productId 
          ? { ...p, quantity: p.quantity + parseInt(formData.quantity) } 
          : p
      ));
      
      setFormData({
        productId: '',
        quantity: 1,
        batchNumber: '',
        serialNumbers: '',
        supplier: '',
        invoiceNumber: '',
        recipient: '',
        shippingDate: new Date().toISOString().split('T')[0]
      });
      
      showMsg('Товар успешно принят на склад!', 'success');
    } else {
      throw new Error(result.message || 'Ошибка при приемке товара');
    }
  } catch (error) {
    showMsg(error.message, 'error');
    console.error('Error receiving product:', error);
  }
};

// Обработчик отгрузки товара
const handleShipProduct = async (e) => {
  e.preventDefault();
  
  try {
    const token = sendSecureRequest(user_code);
    const response = await fetch(`${API_BASE_URL}ship`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...formData,
        user_code,
        quantity: parseInt(formData.quantity)
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      setProducts(prev => prev.map(p => 
        p.id === formData.productId 
          ? { ...p, quantity: p.quantity - parseInt(formData.quantity) } 
          : p
      ));
      
      setFormData(prev => ({
        ...prev,
        productId: '',
        quantity: 1,
        recipient: ''
      }));
      
      showMsg(`Товар успешно отгружен для ${formData.recipient}!`, 'success');
    } else {
      throw new Error(result.message || 'Ошибка при отгрузке товара');
    }
  } catch (error) {
    showMsg(error.message, 'error');
    console.error('Error shipping product:', error);
  }
};

  const filteredBatches = batches.filter(batch => {
    const product = products.find(p => p.id === batch.product_id);
    return (
      batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product && product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

return (
  <div className="tab-content">
    <Notification />
    <div className="tab-header">
      <h2 className="tab-title">Приемка и отгрузка</h2>
      <div className="tab-actions">
        <button 
          className={`tab-button ${activeTab === 'receiving' ? 'active' : ''}`}
          onClick={() => setActiveTab('receiving')}
        >
          Приемка
        </button>
        <button 
          className={`tab-button ${activeTab === 'shipping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shipping')}
        >
          Отгрузка
        </button>
        <button 
          className={`tab-button ${activeTab === 'batches' ? 'active' : ''}`}
          onClick={() => setSelectedBatch(null)}
        >
          Учет партий
        </button>
      </div>
    </div>

    <div className="grid-container">
      {activeTab === 'receiving' && (
        <div className="card span-2">
          <h3>Приемка товаров</h3>
          <form onSubmit={handleReceiveProduct} className="receiving-form">
            <div className="form-group">
              <label htmlFor="productId">Товар</label>
              <select 
                id="productId" 
                name="productId" 
                value={formData.productId}
                onChange={handleInputChange}
                required
              >
                <option value="">Выберите товар</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Категория: {categories.find(c => c.id === product.category_id)?.name || 'Без категории'}, Остаток: {product.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantity">Количество</label>
                <input 
                  type="number" 
                  id="quantity" 
                  name="quantity" 
                  min="1" 
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="batchNumber">Номер партии (опционально)</label>
                <input 
                  type="text" 
                  id="batchNumber" 
                  name="batchNumber" 
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  placeholder="BATCH-001-2023"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="serialNumbers">Серийные номера (по одному на строку)</label>
              <textarea 
                id="serialNumbers" 
                name="serialNumbers" 
                rows="3"
                value={formData.serialNumbers}
                onChange={handleInputChange}
                placeholder="SN-12345678\nSN-87654321"
              />
              <button 
                type="button" 
                className="secondary-button"
                onClick={handleAddSerialNumbers}
              >
                Подтвердить серийные номера
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="supplier">Поставщик</label>
                <input 
                  type="text" 
                  id="supplier" 
                  name="supplier" 
                  value={formData.supplier}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="invoiceNumber">Номер накладной</label>
                <input 
                  type="text" 
                  id="invoiceNumber" 
                  name="invoiceNumber" 
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="primary-button">
              Оформить приемку
            </button>
          </form>
        </div>
      )}

      {activeTab === 'shipping' && (
        <div className="card span-2">
          <h3>Отгрузка товаров</h3>
          <form onSubmit={handleShipProduct} className="shipping-form">
            <div className="form-group">
              <label htmlFor="productId">Товар</label>
              <select 
                id="productId" 
                name="productId" 
                value={formData.productId}
                onChange={handleInputChange}
                required
              >
                <option value="">Выберите товар</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Остаток: {product.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantity">Количество</label>
                <input 
                  type="number" 
                  id="quantity" 
                  name="quantity" 
                  min="1" 
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="recipient">Получатель</label>
                <input 
                  type="text" 
                  id="recipient" 
                  name="recipient" 
                  value={formData.recipient}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="shippingDate">Дата отгрузки</label>
              <input 
                type="date" 
                id="shippingDate" 
                name="shippingDate" 
                value={formData.shippingDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className="primary-button">
              Оформить отгрузку
            </button>
          </form>
        </div>
      )}

      {activeTab === 'batches' && (
        <>
          <div className="card span-2">
            <div className="batch-header">
              <h3>Учёт партий и серийных номеров</h3>
              <div className="search-box">
                <input 
                  type="text" 
                  placeholder="Поиск по номеру партии или товару..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="search-icon">🔍</span>
              </div>
            </div>

            <div className="batch-list">
              {filteredBatches.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Номер партии</th>
                      <th>Товар</th>
                      <th>Количество</th>
                      <th>Дата приемки</th>
                      <th>Поставщик</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map(batch => {
                      const product = products.find(p => p.id === batch.product_id);
                      return (
                        <tr 
                          key={batch.id} 
                          onClick={() => setSelectedBatch(batch)}
                          className={selectedBatch?.id === batch.id ? 'selected-row' : ''}
                        >
                          <td>{batch.batch_number}</td>
                          <td>{product ? product.name : 'Неизвестный товар'}</td>
                          <td>{batch.quantity}</td>
                          <td>{new Date(batch.received_date).toLocaleDateString()}</td>
                          <td>{batch.supplier}</td>
                          <td>
                            <button 
                              className="small-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBatch(batch);
                              }}
                            >
                              Подробности
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="no-results">Партии не найдены</p>
              )}
            </div>
          </div>

          {selectedBatch && (
            <div className="card batch-details">
              <div className="batch-details-header">
                <h4>Детали партии: {selectedBatch.batch_number}</h4>
                <button 
                  className="close-button"
                  onClick={() => setSelectedBatch(null)}
                >
                  ×
                </button>
              </div>

              <div className="batch-info">
                <div className="info-row">
                  <span className="info-label">Товар:</span>
                  <span className="info-value">
                    {products.find(p => p.id === selectedBatch.product_id)?.name || 'Неизвестный товар'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Количество:</span>
                  <span className="info-value">{selectedBatch.quantity}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Дата приемки:</span>
                  <span className="info-value">
                    {new Date(selectedBatch.received_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Поставщик:</span>
                  <span className="info-value">{selectedBatch.supplier}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Номер накладной:</span>
                  <span className="info-value">{selectedBatch.invoice_number}</span>
                </div>
              </div>

              {selectedBatch.serial_numbers && selectedBatch.serial_numbers.length > 0 && (
                <div className="serial-numbers">
                  <h5>Серийные номера:</h5>
                  <div className="serial-numbers-list">
                    {selectedBatch.serial_numbers.map((sn, index) => (
                      <span key={index} className="serial-number-tag">{sn}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="card quick-stats">
        <h3>Быстрая статистика</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{products.length}</span>
            <span className="stat-label">Всего товаров</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {products.reduce((sum, product) => sum + product.quantity, 0)}
            </span>
            <span className="stat-label">Общий остаток</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{batches.length}</span>
            <span className="stat-label">Всего партий</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {batches.reduce((sum, batch) => sum + batch.quantity, 0)}
            </span>
            <span className="stat-label">Товаров в партиях</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default ShippingTab;