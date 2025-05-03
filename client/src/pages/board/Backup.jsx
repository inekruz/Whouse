import { FiDatabase } from 'react-icons/fi';
import './css/Backup.css';

const Backup = () => {
  return (
    <div className="tab-content">
      <div className="content-header">
        <FiDatabase className="header-tab-icon" />
        <h2>Резервное копирование</h2>
      </div>
      
      <div className="content-card">
        <p>Здесь будет управление резервными копиями</p>
      </div>
    </div>
  );
};

export default Backup;