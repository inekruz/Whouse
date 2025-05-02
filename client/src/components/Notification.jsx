import React, { useEffect, useState } from 'react';
import './css/Notification.css';

const Notification = ({ message, type }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || !message) return null;

  const notificationClass = type === 'success' ? 'notification success' : 'notification error';

  return (
    <div className={notificationClass}>
      {message}
    </div>
  );
};

export default Notification;
