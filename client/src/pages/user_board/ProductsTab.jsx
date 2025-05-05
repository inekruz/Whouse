import React from 'react';
import '../css/Dashboard.css';

const ProductsTab = () => {
  return (
    <div className="tab-content">
      <h2 className="tab-title">Работа с товарными позициями</h2>
      <div className="grid-container">
        <div className="card">
          <h3>Просмотр списка товаров</h3>
          <p>Полный список всех товаров на складе с детализацией</p>
        </div>
        
        <div className="card">
          <h3>Добавление новых товаров</h3>
          <p>Создание новых товарных позиций в системе</p>
        </div>
        
        <div className="card">
          <h3>Редактирование характеристик</h3>
          <p>Изменение параметров существующих товаров</p>
        </div>
        
        <div className="card">
          <h3>Удаление товаров</h3>
          <p>Удаление товарных позиций из системы</p>
        </div>
        
        <div className="card span-2">
          <h3>Поиск и фильтрация</h3>
          <p>Расширенный поиск по всем характеристикам товаров</p>
        </div>
      </div>
    </div>
  );
};

export default ProductsTab;