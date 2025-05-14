import React, { useState, useEffect } from 'react';
import { sendSecureRequest } from '../../components/SecureToken';
import '../css/Dashboard.css';

const BASE_URL = 'https://api.whous.ru/prd';
const ProductsTab = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [code, setCode] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    quantity: 0,
    price: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 10000]);

  useEffect(() => {
    const init = async () => {
      const storedCode = localStorage.getItem('dnum');
      if (!storedCode) return;
      setCode(storedCode);

      const authTokenForProducts = sendSecureRequest(storedCode);
      await fetchProducts(storedCode, authTokenForProducts);

      const authTokenForCategories = sendSecureRequest(storedCode);
      await fetchCategories(storedCode, authTokenForCategories);
    };

    init();
  }, []);


  const fetchProducts = async (userCode, authToken) => {
    try {
      const res = await fetch(`${BASE_URL}/getAll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({ user_code: userCode })
      });

      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Ошибка при загрузке товаров:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async (userCode, authToken) => {
    try {
      const res = await fetch(`${BASE_URL}/ctg/getAll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({ user_code: userCode })
      });
  
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Ошибка при загрузке категорий:', err);
    }
  };

  const addProduct = async () => {
    try {
      const token = sendSecureRequest(code);
      const res = await fetch(`${BASE_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ user_code: code, ...formData })
      });

      const newProduct = await res.json();
      setProducts([...products, newProduct]);
    } catch (err) {
      console.error('Ошибка при добавлении товара:', err);
    }
  };

  const updateProduct = async (id) => {
    try {
      const token = sendSecureRequest(code);
      const res = await fetch(`${BASE_URL}/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ user_code: code, ...formData })
      });

      const updatedProduct = await res.json();
      setProducts(products.map(p => p.id === id ? updatedProduct : p));
    } catch (err) {
      console.error('Ошибка при обновлении товара:', err);
    }
  };

  const deleteProduct = async (id) => {
    try {
      const token = sendSecureRequest(code);
      const res = await fetch(`${BASE_URL}/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ user_code: code })
      });

      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        console.error('Ошибка при удалении товара');
      }
    } catch (err) {
      console.error('Ошибка при удалении товара:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentProduct) {
      await updateProduct(currentProduct.id);
    } else {
      await addProduct();
    }

    setIsModalOpen(false);
    setCurrentProduct(null);
    resetForm();
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      quantity: product.quantity,
      price: product.price
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      await deleteProduct(productId);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      quantity: 0,
      price: 0
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = String(product.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(product.description).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || Number(product.category_id) === parseInt(categoryFilter);
    const matchesPrice = Number(product.price) >= priceRange[0] && Number(product.price) <= priceRange[1];

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Без категории';
  };
  return (
    <div className="tab-content products-tab">
      <div className="products-header">
        <h2 className="tab-title">Управление товарами</h2>
        <div className="products-actions">
          <button 
            className="btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            Добавить товар
          </button>
        </div>
      </div>
      
      {/* Панель поиска и фильтрации */}
      <div className="products-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Поиск по названию или описанию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="search-icon2" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </div>
        
        <div className="filter-group">
          <label>Категория:</label>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Все категории</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Цена: от {priceRange[0]} до {priceRange[1]}</label>
          <div className="range-slider">
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
            />
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            />
          </div>
        </div>
      </div>
      
      {/* Таблица товаров */}
      {isLoading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Категория</th>
                <th>Количество</th>
                <th>Цена</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td className="description-cell">{product.description}</td>
                    <td>{getCategoryName(product.category_id)}</td>
                    <td className={product.quantity < 10 ? 'low-stock' : ''}>
                      {product.quantity}
                    </td>
                    <td>{Number(product.price).toFixed(2)}₽</td>
                    <td className="actions-cell">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEdit(product)}
                      >
                        <svg viewBox="0 0 24 24">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(product.id)}
                      >
                        <svg viewBox="0 0 24 24">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-results">
                    Нет товаров, соответствующих вашим критериям поиска
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Модальное окно для добавления/редактирования */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{currentProduct ? 'Редактировать товар' : 'Добавить новый товар'}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setIsModalOpen(false);
                  setCurrentProduct(null);
                  setFormData({
                    name: '',
                    description: '',
                    category_id: '',
                    quantity: 0,
                    price: 0
                  });
                }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Название товара</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Категория</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Количество</label>
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Цена</label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    setCurrentProduct(null);
                    setFormData({
                      name: '',
                      description: '',
                      category_id: '',
                      quantity: 0,
                      price: 0
                    });
                  }}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  {currentProduct ? 'Сохранить изменения' : 'Добавить товар'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTab;