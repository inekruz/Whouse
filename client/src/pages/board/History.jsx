import { FiClock } from 'react-icons/fi';
import './css/Settings.css';

const Settings = () => {
  return (
    <div className="tab-content">
      <div className="content-header">
        <FiClock className="header-tab-icon" />
        <h2>История работы склада</h2>
      </div>
      
      <div className="content-card">
        <p>Здесь будет история работы сотрудников</p>
      </div>
    </div>
  );
};

export default Settings;