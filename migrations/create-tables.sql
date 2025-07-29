-- 投资组合表 (Portfolio)
CREATE TABLE IF NOT EXISTS `portfolios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '投资组合ID，自增主键',
  `userId` INT NOT NULL COMMENT '所属用户ID（外键）',
  `name` VARCHAR(255) NOT NULL COMMENT '组合名称',
  `isDeleted` BOOLEAN DEFAULT FALSE COMMENT '删除标识',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投资组合表';

-- 投资资产表 (PortfolioItem)
CREATE TABLE IF NOT EXISTS `portfolio_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '项目ID，自增主键',
  `portfolioId` INT NOT NULL COMMENT '所属投资组合ID',
  `assetCode` VARCHAR(20) NOT NULL COMMENT '资产代码（如AAPL、BND等）',
  `assetType` ENUM('stock', 'bond', 'cash') NOT NULL COMMENT '资产类型',
  `amount` DECIMAL(15,2) NOT NULL COMMENT '投入金额/持有金额',
  `quantity` DECIMAL(15,4) NOT NULL COMMENT '持仓数量（如股票数量）',
  `type` ENUM('buy', 'sell') NOT NULL COMMENT '买入/卖出',
  `sellDate` DATE NULL COMMENT '卖出日期（可以是空）',
  `purchaseDate` DATE NOT NULL COMMENT '买入日期',
  `isDeleted` BOOLEAN DEFAULT FALSE COMMENT '删除标识',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`portfolioId`) REFERENCES `portfolios`(`id`) ON DELETE CASCADE,
  INDEX `idx_portfolio_asset` (`portfolioId`, `assetCode`),
  INDEX `idx_asset_code` (`assetCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投资资产表';

-- 公共资产信息表 (Asset)
CREATE TABLE IF NOT EXISTS `assets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '项目ID，自增主键',
  `assetCode` VARCHAR(20) NOT NULL UNIQUE COMMENT '资产代码',
  `name` VARCHAR(255) NOT NULL COMMENT '资产名称',
  `assetType` ENUM('stock', 'bond') NOT NULL COMMENT '资产类型',
  `price` DECIMAL(15,4) NOT NULL COMMENT '当前价格（每日更新）',
  `currency` VARCHAR(3) NOT NULL DEFAULT 'USD' COMMENT '币种（如CNY,USD）',
  `historyPriceArr` JSON NULL COMMENT '历史价格数组',
  `dateArr` JSON NULL COMMENT '历史时间粒度（天），对应历史价格',
  `isDeleted` BOOLEAN DEFAULT FALSE COMMENT '删除标识',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最新更新时间',
  INDEX `idx_asset_code` (`assetCode`),
  INDEX `idx_asset_type` (`assetType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公共资产信息表';

-- 收益记录表 (ProfitLog)
CREATE TABLE IF NOT EXISTS `profit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
  `itemId` INT NOT NULL COMMENT '对应 portfolio_item ID',
  `date` DATE NOT NULL COMMENT '日期',
  `value` DECIMAL(15,2) NOT NULL COMMENT '当日资产市值',
  `profit` DECIMAL(15,2) NOT NULL COMMENT '当日收益（或亏损）',
  `isDeleted` BOOLEAN DEFAULT FALSE COMMENT '删除标识',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`itemId`) REFERENCES `portfolio_items`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_item_date` (`itemId`, `date`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收益记录表';

-- 添加外键约束（portfolio_items 表的 assetCode 关联到 assets 表）
ALTER TABLE `portfolio_items` 
ADD CONSTRAINT `fk_portfolio_items_asset_code` 
FOREIGN KEY (`assetCode`) REFERENCES `assets`(`assetCode`) 
ON UPDATE CASCADE;