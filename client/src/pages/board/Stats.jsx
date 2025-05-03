import { FiBarChart2 } from 'react-icons/fi';
import './css/Stats.css';

const Stats = () => {
  return (
    <div className="tab-content">
      <div className="content-header">
        <FiBarChart2 className="header-tab-icon" />
        <h2>Статистика системы</h2>
      </div>
      
      <div className="content-card">
        <p>Здесь будет аналитика и статистика работы системы</p>
      </div>
    </div>
  );
};

export default Stats;