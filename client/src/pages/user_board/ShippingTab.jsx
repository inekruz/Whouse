import React from 'react';
import '../css/Dashboard.css';

const ShippingTab = () => {
  return (
    <div className="tab-content">
      <h2 className="tab-title">Приемка и отгрузка</h2>
      <div className="grid-container">
        <div className="card">
          <h3>Приемка товаров</h3>
          <p>Формирование документов при поступлении товаров</p>
        </div>
        
        <div className="card">
          <h3>Отгрузка товаров</h3>
          <p>Оформление документов на отгрузку со склада</p>
        </div>
        
        <div className="card span-2">
          <h3>Учёт партий и серийных номеров</h3>
          <p>Управление партиями товаров и отслеживание по серийным номерам</p>
        </div>
      </div>
    </div>
  );
};

export default ShippingTab;