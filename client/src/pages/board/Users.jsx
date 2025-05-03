import { FiUsers } from 'react-icons/fi';
import './css/Users.css';

const Users = () => {
  return (
    <div className="tab-content">
      <div className="content-header">
        <FiUsers className="header-tab-icon" />
        <h2>Управление пользователями</h2>
      </div>
      
      <div className="content-card">
        <p>Здесь будет интерфейс для управления пользователями системы</p>
      </div>
    </div>
  );
};

export default Users;