import React, { useState } from 'react';
import './css/Dashboard.css';
import ProductsTab from './user_board/ProductsTab';
import ShippingTab from './user_board/ShippingTab';
import InventoryTab from './user_board/InventoryTab';
import { FiBox, FiTruck } from "react-icons/fi";
import { IoStatsChart } from "react-icons/io5";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="dashboard">
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <span className="tab-icon"><FiBox/></span>
            <span className="tab-text">Товарные позиции</span>
          </button>
          
          <button 
            className={`tab ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            <span className="tab-icon"><FiTruck /></span>
            <span className="tab-text">Приемка/Отгрузка</span>
          </button>
          
          <button 
            className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <span className="tab-icon"><IoStatsChart/></span>
            <span className="tab-text">Управление запасами</span>
          </button>
        </div>
        
        <div className="tab-content-wrapper">
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'shipping' && <ShippingTab />}
          {activeTab === 'inventory' && <InventoryTab />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;