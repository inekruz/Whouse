import './css/Auth.css';

const Auth = ({ onClose }) => {
  return (
    <div className="auth-modal">
      <div className="auth-content">
        <button className="auth-close" onClick={onClose}>
          &times;
        </button>
        <h2>Авторизация</h2>
        <form className="auth-form">
          <div className="form-group">
            <label htmlFor="text">Логин</label>
            <input type="text" id="text" placeholder="Введите ваш логин" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input type="password" id="password" placeholder="Введите пароль" />
          </div>
          <button type="submit" className="auth-submit">
            Войти
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;