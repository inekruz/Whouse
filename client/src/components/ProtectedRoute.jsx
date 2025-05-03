import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, admin = false }) => {
  const tokenKey = admin ? 'admtkn' : 'token';
  const redirectPath = admin ? '/admin' : '/';
  const token = localStorage.getItem(tokenKey);
  
  if (!token) {
    return <Navigate to={redirectPath} replace />;
  }

  try {
    const decoded = jwtDecode(token);
    
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem(tokenKey);
      return <Navigate to={redirectPath} replace />;
    }
    
    if (admin && decoded.role !== 'admin') {
      localStorage.removeItem(tokenKey);
      return <Navigate to={redirectPath} replace />;
    }
  } catch (e) {
    localStorage.removeItem(tokenKey);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;