import React from 'react';
import '../css/Dashboard.css';

const InventoryTab = () => {
  return (
    <div className="tab-content">
      <h2 className="tab-title">Управление запасами</h2>
      <div className="grid-container">
        <div className="card">
          <h3>Остатки товаров</h3>
          <p>Актуальные остатки по всем позициям на складе</p>
        </div>
        
        <div className="card">
          <h3>Перемещение товаров</h3>
          <p>Изменение зон хранения товаров на складе</p>
        </div>
        
        <div className="card span-2">
          <h3>Инвентаризация</h3>
          <p>Проведение инвентаризации с фиксацией расхождений</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryTab;