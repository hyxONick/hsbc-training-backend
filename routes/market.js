const Router = require('koa-router');
const router = new Router({ prefix: '/api/market' });

/**
 * ==========================
 * 市场模拟逻辑
 * ==========================
 *
 * 使用 Box-Muller 生成正态分布 (让大波动概率低)
 * 股票 & 债券 波动幅度不同 (股票大, 债券小)
 * 加入“市场情绪指数 (marketSentiment)”影响波动方向
 * 加入“趋势 (drift)”模拟长期偏移（比如牛市或熊市）
 */

// 🎲 正态分布随机数（Box–Muller Transform）
function normalRandom(mean = 0, stddev = 1) {
  const u = Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + stddev * z;
}

// 📈 随机游走（趋势+波动）
function generateTrend(startPrice, days = 24, drift = 0.0005, volatility = 0.002, sentiment = 0) {
  const prices = [startPrice];
  for (let i = 1; i < days; i++) {
    // 📌 波动由正态分布生成
    const dailyReturn = normalRandom(drift + sentiment * 0.0003, volatility);
    const newPrice = prices[i - 1] * (1 + dailyReturn);
    prices.push(parseFloat(newPrice.toFixed(2)));
  }
  return prices;
}

// 🎭 随机生成市场情绪（-1 到 1）
function getMarketSentiment() {
  return Math.random() * 2 - 1;
}

// =======================
// 1. 全球指数 API
// =======================

/**
 * @swagger
 * /api/market/indices:
 *   get:
 *     summary: 获取全球主要指数趋势
 *     tags: [Market]
 *     description: 模拟生成 S&P500, NASDAQ, DOW, VIX 的当日走势 (24 时间点)
 *     responses:
 *       200:
 *         description: 指数趋势数组
 */
router.get('/indices', async (ctx) => {
  const sentiment = getMarketSentiment(); // 影响全局市场
  const baseIndices = [
    { name: "S&P 500", start: 4185.47, drift: 0.0005, volatility: 0.002 },
    { name: "NASDAQ", start: 12965.34, drift: 0.0006, volatility: 0.0025 },
    { name: "DOW", start: 33745.69, drift: 0.0004, volatility: 0.0015 },
    { name: "VIX", start: 18.45, drift: -0.0002, volatility: 0.005 } // VIX 越低市场越平稳
  ];

  const indices = baseIndices.map(idx => {
    const trend = generateTrend(idx.start, 24, idx.drift, idx.volatility, sentiment);
    const last = trend[trend.length - 1];
    const change = ((last - trend[trend.length - 2]) / trend[trend.length - 2]) * 100;
    return {
      name: idx.name,
      value: parseFloat(last.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      trend
    };
  });

  ctx.body = indices;
});

// =======================
// 2. 涨跌分布 (Histogram)
// =======================

/**
 * @swagger
 * /api/market/rise-fall:
 *   get:
 *     summary: 获取涨跌分布图数据
 *     tags: [Market]
 *     description: 生成“市场情绪热图”，模拟多少股票在不同涨跌区间（±2% 最多，极端少）
 *     responses:
 *       200:
 *         description: 涨跌区间及对应资产数量
 */
router.get('/rise-fall', async (ctx) => {
  const ranges = ["Lim Down", "-8%", "-6%", "-4%", "-2%", "0", "2%", "4%", "6%", "8%", "Lim Up"];
  const histogram = ranges.map((range, i) => {
    let baseCount;
    if (range === "Lim Down" || range === "Lim Up") {
      baseCount = Math.floor(Math.random() * 10) + 5;
    } else if (range === "-8%" || range === "8%") {
      baseCount = Math.floor(Math.random() * 20) + 10;
    } else if (range === "-6%" || range === "6%") {
      baseCount = Math.floor(Math.random() * 40) + 20;
    } else if (range === "-4%" || range === "4%") {
      baseCount = Math.floor(Math.random() * 120) + 50;
    } else if (range === "-2%" || range === "2%") {
      baseCount = Math.floor(Math.random() * 800) + 400;
    } else {
      baseCount = Math.floor(Math.random() * 1500) + 800; // 0 附近最多
    }
    return { range, count: baseCount, sortOrder: i };
  });

  ctx.body = { histogram };
});

// =======================
// 3. 个股行情 API
// =======================

/**
 * @swagger
 * /api/market/stocks:
 *   get:
 *     summary: 获取美股大盘股票行情
 *     tags: [Market]
 *     description: 模拟 AAPL、TSLA 等个股的随机涨跌
 *     responses:
 *       200:
 *         description: 股票行情数组
 */
router.get('/stocks', async (ctx) => {
  const sentiment = getMarketSentiment();
  const stocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 152.34 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 318.56 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 125.67 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 652.78 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 842.12 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 132.77 },
    { symbol: 'META', name: 'Meta Platforms Inc.', price: 298.12 },
    { symbol: 'BABA', name: 'Alibaba Group Holding Ltd.', price: 89.45 }
  ];

  const updated = stocks.map(s => {
    const dailyChangePercent = normalRandom(sentiment * 0.002, 0.015); // 均值受市场情绪影响
    const changeAmount = s.price * dailyChangePercent;
    const newPrice = s.price + changeAmount;
    return {
      symbol: s.symbol,
      name: s.name,
      price: parseFloat(newPrice.toFixed(2)),
      change: parseFloat((dailyChangePercent * 100).toFixed(2)),
      changeAmount: parseFloat(changeAmount.toFixed(2))
    };
  });

  ctx.body = updated;
});

// =======================
// 4. 全部资产 API
// =======================

/**
 * @swagger
 * /api/market/assets:
 *   get:
 *     summary: 获取股票 & 债券等所有资产行情
 *     tags: [Market]
 *     description: 股票波动大，债券波动小，模拟真实金融市场
 *     responses:
 *       200:
 *         description: 资产行情数组
 */
router.get('/assets', async (ctx) => {
  const sentiment = getMarketSentiment();
  const assets = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', price: 152.34 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', price: 318.56 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', price: 125.67 },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', price: 652.78 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', price: 842.12 },
    { symbol: 'Bond A', name: 'US Treasury 10Y', type: 'bond', price: 98.50 },
    { symbol: 'Bond B', name: 'Corporate Bond B', type: 'bond', price: 102.20 },
    { symbol: 'Bond C', name: 'Municipal Bond C', type: 'bond', price: 101.75 },
    { symbol: 'Bond D', name: 'Corporate Bond D', type: 'bond', price: 99.80 },
    { symbol: 'Bond E', name: 'Bond ETF E', type: 'bond', price: 100.40 },
    { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', price: 340.12 },
    { symbol: 'ORCL', name: 'Oracle Corp.', type: 'stock', price: 120.45 }
  ];

  const updated = assets.map(a => {
    const volatility = a.type === 'stock' ? 0.015 : 0.002; // 债券更稳
    const dailyChangePercent = normalRandom(sentiment * 0.001, volatility);
    const changeAmount = a.price * dailyChangePercent;
    const newPrice = a.price + changeAmount;
    return {
      symbol: a.symbol,
      name: a.name,
      type: a.type,
      price: parseFloat(newPrice.toFixed(2)),
      change: parseFloat((dailyChangePercent * 100).toFixed(2)),
      changeAmount: parseFloat(changeAmount.toFixed(2))
    };
  });

  ctx.body = updated;
});

module.exports = router;
