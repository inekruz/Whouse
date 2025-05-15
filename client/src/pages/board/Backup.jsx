import { FiDatabase, FiDownload } from 'react-icons/fi';
import { sendSecureRequest } from '../../components/SecureToken';
import { useState, useEffect } from 'react';
import './css/Backup.css';

const Backup = () => {
  const adminCode = localStorage.getItem('adminCode');
  const token = sendSecureRequest(adminCode);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.whous.ru/bcp/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ adminCode })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tables');
      }

      setTables(data.tables || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchTables();
}, [token, adminCode]);

  const downloadTable = async (tableName) => {
    try {
      const response = await fetch('https://api.whous.ru/bcp/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ 
          tableName,
          adminCode 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download table');
      }

      // Получаем имя файла из заголовков или генерируем
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${tableName}_backup.csv`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Создаем blob и скачиваем файл
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading table:', err);
      setError(err.message);
    }
  };

  return (
    <div className="tab-content">
      <div className="content-header">
        <FiDatabase className="header-tab-icon" />
        <h2>Резервное копирование</h2>
      </div>
      
      <div className="content-card">
        <div className="backup-container">
          {loading ? (
            <div className="loading-spinner">Загрузка списка таблиц...</div>
          ) : error ? (
            <div className="error-message">
              Ошибка при загрузке таблиц: {error}
              <button 
                onClick={fetchTables}
                className="retry-button"
              >
                Повторить попытку
              </button>
            </div>
          ) : tables.length === 0 ? (
            <p>Нет доступных таблиц для резервного копирования</p>
          ) : (
            <div className="tables-grid">
              {tables.map((table) => (
                <div key={table} className="table-card">
                  <div className="table-info">
                    <FiDatabase className="table-icon" />
                    <span className="table-name">{table}</span>
                  </div>
                  <button
                    onClick={() => downloadTable(table)}
                    className="download-button"
                  >
                    <FiDownload className="download-icon" />
                    Скачать
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Backup;
