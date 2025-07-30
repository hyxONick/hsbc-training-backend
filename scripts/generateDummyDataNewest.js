const sequelize = require('../config/database');
const AssetInfo = require('../models/AssetInfo');
const Portfolio = require('../models/Portfolio');
const ProfitLog = require('../models/ProfitLog');
const PortfolioItem = require('../models/PortfolioItem');

const NUM_PORTFOLIOS = 10;
const DAYS = 120;

const assetNames = [
    // { code: 'ADBE', name: 'Adobe Inc.', type: 'stock' },
    // { code: 'CRM', name: 'Salesforce Inc.', type: 'stock' },
    // { code: 'PYPL', name: 'PayPal Holdings Inc.', type: 'stock' },
    // { code: 'SPOT', name: 'Spotify Technology S.A.', type: 'stock' },
    // { code: 'ZM', name: 'Zoom Video Communications', type: 'stock' },
    // { code: 'RIVN', name: 'Rivian Automotive Inc.', type: 'stock' },
    // { code: 'LCID', name: 'Lucid Group Inc.', type: 'stock' },
    // { code: 'NIO', name: 'NIO Inc.', type: 'stock' },
    // { code: 'XPEV', name: 'XPeng Inc.', type: 'stock' },
    // { code: 'JD', name: 'JD.com Inc.', type: 'stock' },
    // { code: 'KR10Y', name: 'Korea Treasury Bond 10Y', type: 'bond' },
    // { code: 'CH5Y', name: 'China Gov Bond 5Y', type: 'bond' },
    // { code: 'IN10Y', name: 'India Gov Bond 10Y', type: 'bond' },
    // { code: 'ZA5Y', name: 'South Africa Gov Bond 5Y', type: 'bond' },
    // { code: 'AR10Y', name: 'Argentina Gov Bond 10Y', type: 'bond' },
    // { code: 'USD', name: 'US Dollar', type: 'cash' },
    // { code: 'CNY', name: 'Chinese Yuan', type: 'cash' },
    // { code: 'AUD', name: 'Australian Dollar', type: 'cash' },
    // { code: 'EUR', name: 'Euro', type: 'cash' },
    // { code: 'JPY', name: 'Japanese Yen', type: 'cash' },


    { code: 'FSLY', name: 'Fastly Inc.', type: 'stock' },
    { code: 'UPST', name: 'Upstart Holdings', type: 'stock' },
    { code: 'PLTR', name: 'Palantir Technologies', type: 'stock' },
    { code: 'SOFI', name: 'SoFi Technologies Inc.', type: 'stock' },
    { code: 'CANO', name: 'Cano Health Inc.', type: 'stock' },
    { code: 'BIGC', name: 'BigCommerce Holdings', type: 'stock' },
    { code: 'ROOT', name: 'Root Inc.', type: 'stock' },
    { code: 'PUBM', name: 'PubMatic Inc.', type: 'stock' },
    { code: 'CERE', name: 'Cerevel Therapeutics', type: 'stock' },
    { code: 'RGTI', name: 'Rigetti Computing', type: 'stock' },
    { code: 'CLSK', name: 'CleanSpark Inc.', type: 'stock' },
    { code: 'SDIG', name: 'Stronghold Digital Mining', type: 'stock' },
    { code: 'HYMC', name: 'Hycroft Mining Holding', type: 'stock' },
    { code: 'BRDS', name: 'Bird Global Inc.', type: 'stock' },
    { code: 'BNGO', name: 'Bionano Genomics Inc.', type: 'stock' },
    { code: 'SGS-2030', name: 'Singapore Gov Bond 2030', type: 'bond' },
    { code: 'PERU-USD', name: 'Peru Sovereign 10Y', type: 'bond' },
    { code: 'ESG-CORP', name: 'ESG Rated Corporate Note', type: 'bond' },
    { code: 'INF-LINK', name: 'Inflation-Linked Note 2028', type: 'bond' },
    { code: 'AFRICA-BOND', name: 'African Development Bank Note', type: 'bond' },
];

const portfolioNames = [
    // 'AI & Semiconductor Fund',
    // 'Green Energy & Solar',
    // 'Ride Sharing Growth',
    // 'Global Bonds & Income',
    // 'Crypto & Metals Basket',
    // 'Asia-Pacific Opportunities',
    // 'Cash & FX Reserve',
    // 'Sustainable Future Fund',
    // 'Tech Disruptor Picks',
    // 'High-Yield International Bonds'


    'Frontier Tech Ventures',
    'Emerging Biotech Select',
    'Digital Infrastructure Trust',
    // 'Climate Risk Hedge Fund',
    // 'Decentralized Finance Index'
];

function generateDateArray(startDate, days) {
    const dates = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
}

function generatePriceArray(days, base = 100, trend = 'neutral') {
    let mean, stddev;
    switch (trend) {
        case 'bull': mean = 0.0025; stddev = 0.018; break;
        case 'bear': mean = -0.0020; stddev = 0.022; break;
        default: mean = 0.0007; stddev = 0.015;
    }

    const prices = [parseFloat(base.toFixed(2))];
    for (let i = 1; i < days; i++) {
        const u = Math.random();
        const v = Math.random();
        const randStdNormal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        const dailyReturn = mean + stddev * randStdNormal;
        const newPrice = prices[i - 1] * Math.exp(dailyReturn);
        prices.push(parseFloat(newPrice.toFixed(2)));
    }
    return prices;
}

function generateCashPriceArray(days, currency) {
    const base = { USD: 1.0, CNY: 7.0, AUD: 0.7, EUR: 1.0, JPY: 0.007 }[currency] || 1.0;
    const prices = [parseFloat(base.toFixed(4))];
    for (let i = 1; i < days; i++) {
        const dailyChange = (Math.random() - 0.5) * 0.003;
        prices.push(parseFloat((prices[i - 1] * (1 + dailyChange)).toFixed(4)));
    }
    return prices;
}

function getRandomDateBetween(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function createData() {
    try {
        console.log('🧹 Clearing old data...');
        // await ProfitLog.destroy({ where: {} });
        // await PortfolioItem.destroy({ where: {} });
        // await Portfolio.destroy({ where: {} });
        // await AssetInfo.destroy({ where: {} });

        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-04-15');
        const dateArr = generateDateArray(startDate, DAYS);
        const createdAssets = [];
        const trends = ['bull', 'bear', 'neutral'];

        console.log('📦 Creating AssetInfo...');
        for (const assetInfo of assetNames) {
            const trend = trends[Math.floor(Math.random() * trends.length)];
            let basePrice;

            if (assetInfo.type === 'stock') {
                basePrice = Math.random() * 180 + 40;
            } else if (assetInfo.type === 'bond') {
                basePrice = Math.random() * 40 + 80;
            } else if (assetInfo.type === 'cash') {
                basePrice = { USD: 1.0, CNY: 7.0, AUD: 0.7, EUR: 1.0, JPY: 0.007 }[assetInfo.code];
            } else {
                basePrice = Math.random() * 500 + 1000;
            }

            const priceArr = assetInfo.type === 'cash'
                ? generateCashPriceArray(DAYS, assetInfo.code)
                : generatePriceArray(DAYS, basePrice, trend);

            const asset = await AssetInfo.create({
                assetCode: assetInfo.code,
                name: assetInfo.name,
                assetType: assetInfo.type,
                price: priceArr[priceArr.length - 1],
                currency: assetInfo.type === 'cash' ? assetInfo.code : 'USD',
                updatedAt: new Date(),
                historyPriceArr: priceArr,
                dateArr,
                isDeleted: false
            });

            createdAssets.push(asset);
        }

        console.log('📁 Creating Portfolios...');
        for (let i = 0; i < NUM_PORTFOLIOS; i++) {
            const portfolio = await Portfolio.create({
                userId: 1,
                name: portfolioNames[i],
                isDeleted: false
            });

            console.log(`📌 Creating PortfolioItems for "${portfolio.name}"...`);
            const assetSubset = createdAssets.sort(() => 0.5 - Math.random()).slice(0, 6);
            let totalCost = 0, totalValue = 0;

            for (const asset of assetSubset) {
                const isBuy = Math.random() > 0.3;
                const quantity = parseFloat((Math.random() * 100 + 10).toFixed(4));

                // 当前价格是当前值
                const currentPrice = asset.historyPriceArr[DAYS - 1];

                // 使用额外扰动创建“买入价格”以制造 gain 差距
                const priceModifier = (Math.random() * 0.4) + 0.8; // multiplier between 0.8–1.2
                const purchasePrice = currentPrice * priceModifier;
                const amount = parseFloat((purchasePrice * quantity).toFixed(2));

                const portfolioItem = await PortfolioItem.create({
                    portfolioId: portfolio.id,
                    assetCode: asset.assetCode,
                    assetType: asset.assetType,
                    amount,
                    quantity,
                    type: isBuy ? 'buy' : 'sell',
                    purchaseDate: getRandomDateBetween(startDate, endDate),
                    isDeleted: false
                });

                const prices = asset.historyPriceArr;
                for (let d = 0; d < DAYS; d++) {
                    const todayPrice = prices[d];
                    const yesterdayPrice = d > 0 ? prices[d - 1] : todayPrice;
                    const value = todayPrice * quantity;
                    const profit = (todayPrice - yesterdayPrice) * quantity;

                    await ProfitLog.create({
                        itemId: portfolioItem.id,
                        date: dateArr[d],
                        value: value.toFixed(2),
                        profit: profit.toFixed(2),
                        isDeleted: false
                    });

                    if (d === DAYS - 1) {
                        totalCost += amount;
                        totalValue += value;
                    }
                }
            }

            const gain = totalValue - totalCost;
            console.log(`💰 ${portfolio.name}: Cost = $${totalCost.toFixed(2)}, Value = $${totalValue.toFixed(2)}, Gain = ${gain >= 0 ? '+' : ''}${gain.toFixed(2)}`);
        }

        console.log('✅ Final dataset created successfully.');
        process.exit();
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

createData();
