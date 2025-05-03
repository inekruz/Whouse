import { FiSettings } from 'react-icons/fi';
import './css/Settings.css';

const Settings = () => {
  return (
    <div className="tab-content">
      <div className="content-header">
        <FiSettings className="header-tab-icon" />
        <h2>Настройки системы</h2>
      </div>
      
      <div className="content-card">
        <p>Здесь будут настройки конфигурации системы</p>
      </div>
    </div>
  );
};

export default Settings;