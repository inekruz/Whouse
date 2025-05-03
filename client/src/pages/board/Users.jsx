import { FiUsers, FiSearch, FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { sendSecureRequest } from '../../components/SecureToken';
import './css/Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [currentUser, setCurrentUser] = useState({
    id: null,
    username: '',
    login: '',
    password: '',
    confirmPassword: '',
    user_code: ''
  });
  const [errors, setErrors] = useState({});

  const getAdminCode = () => {
    return localStorage.getItem('adminCode');
  };

  const getAuthHeaders = () => {
    const adminCode = getAdminCode();
    const token = sendSecureRequest(adminCode);
    return {
      'x-auth-token': token,
      'Content-Type': 'application/json'
    };
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const adminCode = getAdminCode();
      const response = await axios.post('https://api.whous.ru/adm/users/get', {
        page: pagination.page,
        limit: pagination.limit,
        search: search,
        adminCode: adminCode
      }, {
        headers: getAuthHeaders()
      });
      
      setUsers(response.data.data);
      setPagination({
        ...pagination,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  const openModal = (type, user = null) => {
    setModalType(type);
    if (user) {
      setCurrentUser({
        id: user.id,
        username: user.username || '',
        login: user.login || '',
        password: '',
        confirmPassword: '',
        user_code: user.user_code || ''
      });
    } else {
      setCurrentUser({
        id: null,
        username: '',
        login: '',
        password: '',
        confirmPassword: '',
        user_code: ''
      });
    }
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser({ ...currentUser, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!currentUser.login) newErrors.login = 'Логин обязателен';
    if (modalType === 'create' && !currentUser.password) newErrors.password = 'Пароль обязателен';
    if (currentUser.password && currentUser.password !== currentUser.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const adminCode = getAdminCode();
      const requestData = {
        ...currentUser,
        adminCode
      };

      let response;
      
      if (modalType === 'create') {
        response = await axios.post('https://api.whous.ru/adm/users', requestData, {
          headers: getAuthHeaders()
        });
      } else {
        response = await axios.put(`https://api.whous.ru/adm/users/${currentUser.id}`, requestData, {
          headers: getAuthHeaders()
        });
      }
      
      closeModal();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      setErrors({ submit: error.response?.data?.error || 'Ошибка при сохранении' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    
    try {
      const adminCode = getAdminCode();
      await axios.post('https://api.whous.ru/adm/users/delete', {
        id: id,
        adminCode: adminCode
      }, {
        headers: getAuthHeaders()
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div className="tab-content">
      <div className="content-header">
        <FiUsers className="header-tab-icon" />
        <h2>Управление пользователями</h2>
      </div>
      
      <div className="content-card">
        <div className="users-controls">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
            />
          </div>
          <button className="btn-primary" onClick={() => openModal('create')}>
            <FiPlus /> Добавить пользователя
          </button>
        </div>
        
        <div className="users-table-container">
          {loading ? (
            <div className="loading-spinner">Загрузка...</div>
          ) : (
            <>
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Имя пользователя</th>
                    <th>Логин</th>
                    <th>Код</th>
                    <th>Дата создания</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username || '-'}</td>
                        <td>{user.login}</td>
                        <td>{user.user_code || '-'}</td>
                        <td>{new Date(user.created_at).toLocaleString()}</td>
                        <td className="actions">
                          <button className="btn-edit" onClick={() => openModal('edit', user)}>
                            <FiEdit2 />
                          </button>
                          <button className="btn-delete" onClick={() => handleDelete(user.id)}>
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">Пользователи не найдены</td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(pagination.page - 1)} 
                  disabled={pagination.page === 1}
                >
                  <FiChevronLeft />
                </button>
                <span>Страница {pagination.page} из {pagination.totalPages}</span>
                <button 
                  onClick={() => handlePageChange(pagination.page + 1)} 
                  disabled={pagination.page === pagination.totalPages}
                >
                  <FiChevronRight />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{modalType === 'create' ? 'Добавить пользователя' : 'Редактировать пользователя'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Имя пользователя</label>
                <input
                  type="text"
                  name="username"
                  value={currentUser.username}
                  onChange={handleInputChange}
                  placeholder="Введите имя пользователя"
                />
              </div>
              
              <div className="form-group">
                <label>Логин*</label>
                <input
                  type="text"
                  name="login"
                  value={currentUser.login}
                  onChange={handleInputChange}
                  placeholder="Введите логин"
                  className={errors.login ? 'error' : ''}
                />
                {errors.login && <span className="error-message">{errors.login}</span>}
              </div>
              
              <div className="form-group">
                <label>Пароль{modalType === 'create' ? '*' : ''}</label>
                <input
                  type="password"
                  name="password"
                  value={currentUser.password}
                  onChange={handleInputChange}
                  placeholder={modalType === 'create' ? 'Введите пароль' : 'Оставьте пустым, если не хотите менять'}
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              
              <div className="form-group">
                <label>Подтвердите пароль{modalType === 'create' ? '*' : ''}</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={currentUser.confirmPassword}
                  onChange={handleInputChange}
                  placeholder={modalType === 'create' ? 'Подтвердите пароль' : 'Оставьте пустым, если не хотите менять'}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
              
              <div className="form-group">
                <label>Код пользователя</label>
                <input
                  type="text"
                  name="user_code"
                  value={currentUser.user_code}
                  onChange={handleInputChange}
                  placeholder="Введите код пользователя"
                />
              </div>
              
              {errors.submit && <div className="form-error">{errors.submit}</div>}
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  {modalType === 'create' ? 'Создать' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;