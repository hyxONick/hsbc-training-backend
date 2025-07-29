import React, { useState, useEffect } from 'react';

// Market Condition data with current real-time values
export const marketData = [
  { name: "S&P 500", value: "6,389.77", change: 0.02 },
  { name: "NASDAQ", value: "23,356.27", change: 0.36 },
  { name: "DOW", value: "44,837.56", change: -0.14 },
  { name: "VIX", value: "15.03", change: 0.67 },
];

// Top performing stocks data
export const stockData = [
  { symbol: "AAPL", name: "Apple Inc.", value: 213.88, change: 0.08 },
  { symbol: "MSFT", name: "Microsoft Corp.", value: 512.50, change: -0.24 },
  { symbol: "NVDA", name: "NVIDIA Corp.", value: 176.75, change: 1.87 },
  { symbol: "TSLA", name: "Tesla Inc.", value: 325.59, change: 3.02 },
  { symbol: "META", name: "Meta Platforms", value: 717.63, change: 0.69 },
];

// Bond market data with current yields
export const bondData = [
  { name: "US Treasury 10Y", yield: "4.38%", change: -0.02 },
  { name: "Corporate Bonds", yield: "5.49%", change: -0.11 },
  { name: "Municipal Bonds", yield: "4.15%", change: 0.05 },
];

// Default dashboard data structure matching backend model
export const defaultDashboardData = {
  // 股票净值 - 完全匹配后端字段名
  stockNW: 12100,          // 当前股票净值
  stockNW_1m: 11820,       // 上月末股票净值
  stockNW_1d: 12000,       // 昨日股票净值

  // 现金净值
  cashNW: 2100,            // 当前现金净值

  // 债券净值
  bondNW: 5320,            // 当前债券净值

  // 投入总金额
  invest_amount: 20000,    // 投入的本金总和

  // 近6个月每月收益数组 - 完全匹配后端字段名
  stockProfit6M: [
    { month: '2024-03', profit: 480 },
    { month: '2024-04', profit: -120 },
    { month: '2024-05', profit: 320 },
    { month: '2024-06', profit: 140 },
    { month: '2024-07', profit: 280 },
    { month: '2024-08', profit: 100 },
  ],
  bondProfit6M: [
    { month: '2024-03', profit: 100 },
    { month: '2024-04', profit: 20 },
    { month: '2024-05', profit: 80 },
    { month: '2024-06', profit: 80 },
    { month: '2024-07', profit: 40 },
    { month: '2024-08', profit: 20 },
  ],
  cashProfit6M: [
    { month: '2024-03', profit: -50 },
    { month: '2024-04', profit: 100 },
    { month: '2024-05', profit: 20 },
    { month: '2024-06', profit: -40 },
    { month: '2024-07', profit: 70 },
    { month: '2024-08', profit: 20 },
  ]
};

// Dashboard component
const Dashboard = ({ dashboardData = defaultDashboardData }) => {
  const [data, setData] = useState(dashboardData);

  // 从后端API获取数据的函数
  const fetchDashboardData = async () => {
    try {
      // 替换为您的实际API端点
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const apiData = await response.json();
        setData(apiData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // 如果API调用失败，使用默认数据
      setData(defaultDashboardData);
    }
  };

  useEffect(() => {
    // 组件挂载时获取数据
    fetchDashboardData();
    
    // 可选：设置定时刷新
    const interval = setInterval(fetchDashboardData, 30000); // 每30秒刷新一次
    return () => clearInterval(interval);
  }, []);

  // 基于后端模型计算派生值
  const totalPortfolioValue = data.stockNW + data.cashNW + data.bondNW;
  const totalReturn = totalPortfolioValue - data.invest_amount;
  const totalReturnPercentage = ((totalReturn / data.invest_amount) * 100).toFixed(2);

  // 计算日变化（基于昨日股票净值）
  const stockDailyChange = data.stockNW - data.stockNW_1d;
  const totalDailyChange = stockDailyChange; // 只有股票有昨日数据

  // 计算月变化（基于上月股票净值）
  const stockMonthlyChange = data.stockNW - data.stockNW_1m;

  return (
    <div className="dashboard-container p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">投资组合仪表板</h1>
        <p className="text-gray-600">基于后端模型的实时数据展示</p>
      </div>

      {/* Portfolio Summary - 基于后端模型字段 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">总资产净值</h3>
          <p className="text-2xl font-bold text-gray-900">${totalPortfolioValue.toLocaleString()}</p>
          <p className={`text-sm ${totalDailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalDailyChange >= 0 ? '+' : ''}${totalDailyChange} 今日变化
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">总收益</h3>
          <p className="text-2xl font-bold text-gray-900">${totalReturn.toLocaleString()}</p>
          <p className={`text-sm ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalReturnPercentage}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">投入本金总和</h3>
          <p className="text-2xl font-bold text-gray-900">${data.invest_amount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">invest_amount</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">资产配置</h3>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>股票 (stockNW)</span>
              <span>{((data.stockNW / totalPortfolioValue) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>债券 (bondNW)</span>
              <span>{((data.bondNW / totalPortfolioValue) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>现金 (cashNW)</span>
              <span>{((data.cashNW / totalPortfolioValue) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 后端模型字段详情展示 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 股票净值详情 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">股票净值详情</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">当前股票净值 (stockNW)</span>
              <span className="font-bold text-lg">${data.stockNW.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">上月末股票净值 (stockNW_1m)</span>
              <span className="font-medium">${data.stockNW_1m.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">昨日股票净值 (stockNW_1d)</span>
              <span className="font-medium">${data.stockNW_1d.toLocaleString()}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-center">
              <span className="text-gray-600">日变化</span>
              <span className={`font-medium ${stockDailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stockDailyChange >= 0 ? '+' : ''}${stockDailyChange}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">月变化</span>
              <span className={`font-medium ${stockMonthlyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stockMonthlyChange >= 0 ? '+' : ''}${stockMonthlyChange}
              </span>
            </div>
          </div>
        </div>

        {/* 现金和债券净值 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">其他资产净值</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">现金净值 (cashNW)</span>
                <span className="font-bold text-lg">${data.cashNW.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{width: `${(data.cashNW / totalPortfolioValue) * 100}%`}}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">债券净值 (bondNW)</span>
                <span className="font-bold text-lg">${data.bondNW.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{width: `${(data.bondNW / totalPortfolioValue) * 100}%`}}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 市场行情 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">市场行情</h2>
          <div className="space-y-3">
            {marketData.map((market, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{market.name}</span>
                <div className="text-right">
                  <div className="font-medium">{market.value}</div>
                  <div className={`text-xs ${market.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {market.change >= 0 ? '+' : ''}{market.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6个月收益表现 - 基于后端数组字段 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">6个月收益表现 (基于后端数组)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-3">股票收益 (stockProfit6M)</h3>
            <div className="space-y-2">
              {data.stockProfit6M.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{item.month}</span>
                  <span className={`text-sm font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.profit >= 0 ? '+' : ''}${item.profit}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-3">债券收益 (bondProfit6M)</h3>
            <div className="space-y-2">
              {data.bondProfit6M.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{item.month}</span>
                  <span className={`text-sm font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.profit >= 0 ? '+' : ''}${item.profit}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-3">现金收益 (cashProfit6M)</h3>
            <div className="space-y-2">
              {data.cashProfit6M.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{item.month}</span>
                  <span className={`text-sm font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.profit >= 0 ? '+' : ''}${item.profit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 数据刷新指示器 */}
      <div className="mt-6 text-center">
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          刷新数据
        </button>
        <p className="text-xs text-gray-500 mt-2">
          数据每30秒自动刷新 | 点击按钮手动刷新
        </p>
      </div>
    </div>
  );
};

export default Dashboard;