/*
 Модуль математического моделирования для склада
 Включает расчеты остатков, прогнозирование, анализ движения товаров
*/

class WarehouseMath {
  /* расчет оптимального уровеня запасов (Reorder Point) */
  static calculateReorderPoint(leadTime, demand, safetyStock = 0) {
    return (leadTime * demand) + safetyStock;
  }

  /* расчет экономичного объема заказов (EOQ) */
  static calculateEOQ(annualDemand, orderCost, holdingCost) {
    return Math.sqrt((2 * annualDemand * orderCost) / holdingCost);
  }

  /* расчет оборачиваемостью товара */
  static calculateTurnover(sales, averageInventory) {
    return sales / averageInventory;
  }

  /* прогноз остатков на основе истории движения */
  static forecastInventory(history, days) {
    if (history.length < 2) return [];
    
    // Простое линейное прогнозирование
    const first = history[0];
    const last = history[history.length - 1];
    const timeDiff = (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24);
    const quantityDiff = last.quantity - first.quantity;
    const dailyChange = quantityDiff / timeDiff;
    
    const forecast = [];
    const lastDate = new Date(last.date);
    
    for (let i = 1; i <= days; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + i);
      
      forecast.push({
        date: nextDate.toISOString().split('T')[0],
        predictedQuantity: Math.max(0, last.quantity + (dailyChange * i))
      });
    }
    
    return forecast;
  }

  /* анализ ABC-классификаций товаров */
  static analyzeABC(products) {
    if (!products.length) return { A: [], B: [], C: [] };
    
    // расчет стоимости запасов для каждого товара
    const withValue = products.map(p => ({
      ...p,
      value: p.quantity * p.price
    })).sort((a, b) => b.value - a.value);
    
    // расчет кумулятивных процентлв
    const totalValue = withValue.reduce((sum, p) => sum + p.value, 0);
    let cumulativeValue = 0;
    
    const result = { A: [], B: [], C: [] };
    
    for (const product of withValue) {
      cumulativeValue += product.value;
      const percentage = (cumulativeValue / totalValue) * 100;
      
      if (percentage <= 80) {
        result.A.push(product);
      } else if (percentage <= 95) {
        result.B.push(product);
      } else {
        result.C.push(product);
      }
    }
    
    return result;
  }

  /* расчет страхового запаса */
  static calculateSafetyStock(maxDemand, avgDemand, maxLeadTime, avgLeadTime) {
    const demandVariability = maxDemand - avgDemand;
    const leadTimeVariability = maxLeadTime - avgLeadTime;
    return Math.sqrt(
      (leadTimeVariability * avgDemand ** 2) + 
      (avgLeadTime * demandVariability ** 2)
    );
  }

  /* анализ движения товаров между локациями */
  static analyzeTransfers(transfers) {
    const stats = {
      totalTransfers: transfers.length,
      byProduct: {},
      byLocation: {
        from: {},
        to: {}
      },
      daily: {}
    };
    
    for (const transfer of transfers) {
      // Статистика по продуктам
      if (!stats.byProduct[transfer.product_id]) {
        stats.byProduct[transfer.product_id] = 0;
      }
      stats.byProduct[transfer.product_id]++;
      
      // Статистика по локациям (откуда)
      if (!stats.byLocation.from[transfer.from]) {
        stats.byLocation.from[transfer.from] = 0;
      }
      stats.byLocation.from[transfer.from]++;
      
      // Статистика по локациям (куда)
      if (!stats.byLocation.to[transfer.to]) {
        stats.byLocation.to[transfer.to] = 0;
      }
      stats.byLocation.to[transfer.to]++;
      
      // Статистика по дням
      const date = transfer.date.split('T')[0];
      if (!stats.daily[date]) {
        stats.daily[date] = 0;
      }
      stats.daily[date]++;
    }
    
    return stats;
  }
}

module.exports = WarehouseMath;