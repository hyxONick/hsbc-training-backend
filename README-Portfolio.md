# 投资组合管理系统 - 数据库模型

本项目为投资组合管理系统的 Koa.js + Sequelize 数据库模型实现。

## 数据库表结构

### 1. 投资组合表 (portfolios)
```sql
- id: INT (PK) - 投资组合ID，自增主键
- userId: INT (FK) - 所属用户ID（外键）
- name: VARCHAR - 组合名称
- isDeleted: BOOLEAN - 删除标识
- createdAt: DATETIME - 创建时间
- updatedAt: DATETIME - 更新时间
```

### 2. 投资资产表 (portfolio_items)
```sql
- id: INT (PK) - 项目ID，自增主键
- portfolioId: INT (FK) - 所属投资组合ID
- assetCode: VARCHAR - 资产代码（如AAPL、BND等）
- assetType: ENUM - 资产类型 (stock, bond, cash)
- amount: DECIMAL - 投入金额/持有金额
- quantity: DECIMAL - 持仓数量（如股票数量）
- type: ENUM - 买入/卖出 (buy, sell)
- sellDate: DATE - 卖出日期（可以是空）
- purchaseDate: DATE - 买入日期
- isDeleted: BOOLEAN - 删除标识
```

### 3. 公共资产信息表 (assets)
```sql
- id: INT (PK) - 项目ID，自增主键
- assetCode: VARCHAR - 资产代码
- name: VARCHAR - 资产名称
- assetType: ENUM - 资产类型（stock, bond）
- price: DECIMAL - 当前价格（每日更新）
- currency: VARCHAR - 币种（如CNY,USD）
- historyPriceArr: JSON - 历史价格数组
- dateArr: JSON - 历史时间粒度（天），对应历史价格
- isDeleted: BOOLEAN - 删除标识
- updatedAt: DATETIME - 最新更新时间
```

### 4. 收益记录表 (profit_logs)
```sql
- id: INT (PK) - 主键
- itemId: INT (FK) - 对应 portfolio_item ID
- date: DATE - 日期
- value: DECIMAL - 当日资产市值
- profit: DECIMAL - 当日收益（或亏损）
- isDeleted: BOOLEAN - 删除标识
```

## 模型关系

- **User** → **Portfolio** (一对多)
- **Portfolio** → **PortfolioItem** (一对多)
- **Asset** → **PortfolioItem** (一对多，通过assetCode关联)
- **PortfolioItem** → **ProfitLog** (一对多)

## 安装和使用

### 1. 数据库同步
```bash
node scripts/sync-database.js
```

### 2. 添加示例数据
```bash
node scripts/seed-sample-data.js
```

### 3. 使用模型

#### 导入模型
```javascript
const { Portfolio, PortfolioItem, Asset, ProfitLog, User } = require('./models');
```

#### 创建投资组合
```javascript
const portfolio = await Portfolio.create({
  userId: 1,
  name: '我的投资组合',
  isDeleted: false
});
```

#### 添加投资项目
```javascript
const portfolioItem = await PortfolioItem.create({
  portfolioId: portfolio.id,
  assetCode: 'AAPL',
  assetType: 'stock',
  amount: 15000.00,
  quantity: 100,
  type: 'buy',
  purchaseDate: '2024-01-01'
});
```

#### 查询投资组合详情
```javascript
const portfolio = await Portfolio.findByPk(portfolioId, {
  include: [
    {
      model: PortfolioItem,
      as: 'items',
      include: [
        {
          model: Asset,
          as: 'asset'
        }
      ]
    }
  ]
});
```

#### 记录收益
```javascript
const profitLog = await ProfitLog.create({
  itemId: portfolioItem.id,
  date: '2024-01-02',
  value: 15250.00,
  profit: 250.00
});
```

## 服务层使用

系统提供了 `PortfolioService` 类来简化常用操作：

```javascript
const portfolioService = require('./services/portfolioService');

// 创建投资组合
const portfolio = await portfolioService.createPortfolio(userId, '新组合');

// 获取用户所有投资组合
const portfolios = await portfolioService.getUserPortfolios(userId);

// 添加投资项目
const item = await portfolioService.addPortfolioItem(portfolioId, {
  assetCode: 'AAPL',
  assetType: 'stock',
  amount: 15000,
  quantity: 100,
  type: 'buy',
  purchaseDate: '2024-01-01'
});

// 计算投资组合价值
const portfolioValue = await portfolioService.calculatePortfolioValue(portfolioId);

// 获取收益历史
const profitHistory = await portfolioService.getPortfolioProfitHistory(
  portfolioId, 
  '2024-01-01', 
  '2024-01-31'
);
```

## 数据库配置

确保在 `.env` 文件中配置数据库连接：

```env
MYSQL_DB_HOST=localhost
MYSQL_DB_NAME=portfolio_db
MYSQL_DB_USER=your_username
MYSQL_DB_PASS=your_password
```

## 注意事项

1. 所有模型都包含 `isDeleted` 字段用于软删除
2. 使用 `JSON` 类型存储历史价格数据，适用于 MySQL 5.7+
3. 外键约束确保数据一致性
4. 索引优化查询性能
5. 时间戳自动管理创建和更新时间

## 扩展建议

1. 添加资产分类和行业信息
2. 实现投资组合分析和风险评估
3. 增加交易记录表记录详细交易信息
4. 添加用户通知和提醒功能
5. 实现投资组合比较和基准对比