import React from 'react';

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

// Dashboard data structure with portfolio information
export const dashboardData = {
  // 股票净值
  stockNW: 12100,          // 当前股票净值
  stockNW_lm: 11820,       // 上月末股票净值
  stockNW_ld: 12000,       // 昨日股票净值

  // 现金净值
  cashNW: 2100,            // 当前现金净值
  cashNW_lm: 2030,         // 上月末现金净值
  cashNW_ld: 2080,         // 昨日现金净值

  // 债券净值
  bondNW: 5320,            // 当前债券净值
  bondNW_lm: 5280,         // 上月末债券净值
  bondNW_ld: 5300,         // 昨日债券净值

  // 投入总金额
  invest_amount: 20000,

  // 近6个月每月收益（每项为当前月净值 - 上月净值）
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
const Dashboard = () => {
  // Calculate total portfolio value
  const totalPortfolioValue = dashboardData.stockNW + dashboardData.cashNW + dashboardData.bondNW;
  const totalReturn = totalPortfolioValue - dashboardData.invest_amount;
  const totalReturnPercentage = ((totalReturn / dashboardData.invest_amount) * 100).toFixed(2);

  // Calculate daily changes
  const stockDailyChange = dashboardData.stockNW - dashboardData.stockNW_ld;
  const cashDailyChange = dashboardData.cashNW - dashboardData.cashNW_ld;
  const bondDailyChange = dashboardData.bondNW - dashboardData.bondNW_ld;
  const totalDailyChange = stockDailyChange + cashDailyChange + bondDailyChange;

  return (
    <div className="dashboard-container p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">投资组合仪表板</h1>
        <p className="text-gray-600">实时市场数据和投资组合概览</p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">总资产净值</h3>
          <p className="text-2xl font-bold text-gray-900">${totalPortfolioValue.toLocaleString()}</p>
          <p className={`text-sm ${totalDailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalDailyChange >= 0 ? '+' : ''}${totalDailyChange} 今日
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
          <h3 className="text-sm font-medium text-gray-500 mb-2">投入本金</h3>
          <p className="text-2xl font-bold text-gray-900">${dashboardData.invest_amount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">初始投资</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">资产配置</h3>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>股票</span>
              <span>{((dashboardData.stockNW / totalPortfolioValue) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>债券</span>
              <span>{((dashboardData.bondNW / totalPortfolioValue) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>现金</span>
              <span>{((dashboardData.cashNW / totalPortfolioValue) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Market Conditions */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">市场行情</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {marketData.map((market, index) => (
            <div key={index} className="text-center p-4 border rounded-lg">
              <h3 className="font-medium text-gray-700">{market.name}</h3>
              <p className="text-lg font-bold text-gray-900">{market.value}</p>
              <p className={`text-sm ${market.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {market.change >= 0 ? '+' : ''}{market.change}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Holdings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Stock Holdings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">股票持仓</h2>
          <div className="space-y-4">
            {stockData.map((stock, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{stock.symbol}</h3>
                  <p className="text-sm text-gray-600">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${stock.value}</p>
                  <p className={`text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bond Holdings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">债券持仓</h2>
          <div className="space-y-4">
            {bondData.map((bond, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{bond.name}</h3>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{bond.yield}</p>
                  <p className={`text-sm ${bond.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {bond.change >= 0 ? '+' : ''}{bond.change}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio Performance Chart Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">6个月收益表现</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">股票收益</h3>
            <div className="space-y-2">
              {dashboardData.stockProfit6M.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.month}</span>
                  <span className={item.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {item.profit >= 0 ? '+' : ''}${item.profit}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-2">债券收益</h3>
            <div className="space-y-2">
              {dashboardData.bondProfit6M.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.month}</span>
                  <span className={item.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {item.profit >= 0 ? '+' : ''}${item.profit}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-2">现金收益</h3>
            <div className="space-y-2">
              {dashboardData.cashProfit6M.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.month}</span>
                  <span className={item.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {item.profit >= 0 ? '+' : ''}${item.profit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;