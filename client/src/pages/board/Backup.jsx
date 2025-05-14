import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/Backup.css';

const Backup = ({ token }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminCode, setAdminCode] = useState('');

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('https://api.whous.ru/bcp/get', { adminCode }, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      setTables(response.data.tables);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при запросе');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async (tableName) => {
    try {
      const response = await axios.post('https://api.whous.ru/bcp/backup', { 
        tableName,
        adminCode 
      }, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        responseType: 'blob' // Важно для получения файла
      });

      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tableName}_backup_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Ошибка при скачивании:', err);
      alert(err.response?.data?.message || 'Ошибка при скачивании');
    }
  };

  useEffect(() => {
    if (token && adminCode) {
      fetchTables();
    }
  }, [token, adminCode]);

  return (
    <div className="tables-backup-container">
      <div className="admin-code-input">
        <input
          type="password"
          value={adminCode}
          onChange={(e) => setAdminCode(e.target.value)}
          placeholder="Enter admin code"
          className="code-input"
        />
        <button 
          onClick={fetchTables}
          disabled={!adminCode || loading}
          className="refresh-button"
        >
          {loading ? 'Загрузка...' : 'Попробуйте заново'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tables-grid">
        {tables.map((table) => (
          <div key={table} className="table-card">
            <div className="table-name">{table}</div>
            <button
              onClick={() => handleBackup(table)}
              className="download-button"
            >
              Скачать в CSV
            </button>
          </div>
        ))}
      </div>

      {tables.length === 0 && !loading && (
        <div className="no-tables">Таблицы не найдены :(</div>
      )}
    </div>
  );
};

export default Backup;