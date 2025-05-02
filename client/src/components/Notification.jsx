import React, { useState, useEffect } from 'react';
import './css/Notification.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const listeners = new Set();

export function showMsg(text, type = 'success') {
  listeners.forEach((listener) => listener({ text, type }));
}

const Notification = () => {
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState('');
  const [type, setType] = useState('success');

  useEffect(() => {
    const handler = ({ text, type }) => {
      setMsg(text);
      setType(type === 'error' ? 'error' : 'success');
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
      }, 3000);
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`notification notification-${type}`}>
      {type === 'success' ? (
        <FaCheckCircle className="notification-icon" />
      ) : (
        <FaTimesCircle className="notification-icon" />
      )}
      <span className="notification-text">{msg}</span>
    </div>
  );
};

export default Notification;
