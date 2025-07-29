const { Portfolio, PortfolioItem, Asset, ProfitLog, User } = require('../models');
const { Op } = require('sequelize');

class PortfolioService {
  
  /**
   * 创建新的投资组合
   */
  async createPortfolio(userId, name) {
    try {
      const portfolio = await Portfolio.create({
        userId,
        name,
        isDeleted: false
      });
      return portfolio;
    } catch (error) {
      throw new Error(`创建投资组合失败: ${error.message}`);
    }
  }

  /**
   * 获取用户的所有投资组合
   */
  async getUserPortfolios(userId) {
    try {
      const portfolios = await Portfolio.findAll({
        where: {
          userId,
          isDeleted: false
        },
        include: [
          {
            model: PortfolioItem,
            as: 'items',
            where: { isDeleted: false },
            required: false,
            include: [
              {
                model: Asset,
                as: 'asset'
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      return portfolios;
    } catch (error) {
      throw new Error(`获取投资组合失败: ${error.message}`);
    }
  }

  /**
   * 添加投资项目到组合
   */
  async addPortfolioItem(portfolioId, itemData) {
    try {
      const {
        assetCode,
        assetType,
        amount,
        quantity,
        type,
        purchaseDate,
        sellDate = null
      } = itemData;

      // 验证资产是否存在
      const asset = await Asset.findOne({ where: { assetCode } });
      if (!asset) {
        throw new Error(`资产 ${assetCode} 不存在`);
      }

      const portfolioItem = await PortfolioItem.create({
        portfolioId,
        assetCode,
        assetType,
        amount,
        quantity,
        type,
        purchaseDate,
        sellDate,
        isDeleted: false
      });

      return portfolioItem;
    } catch (error) {
      throw new Error(`添加投资项目失败: ${error.message}`);
    }
  }

  /**
   * 获取投资组合详情（包含所有项目和最新收益）
   */
  async getPortfolioDetails(portfolioId) {
    try {
      const portfolio = await Portfolio.findByPk(portfolioId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          },
          {
            model: PortfolioItem,
            as: 'items',
            where: { isDeleted: false },
            required: false,
            include: [
              {
                model: Asset,
                as: 'asset'
              },
              {
                model: ProfitLog,
                as: 'profitLogs',
                limit: 1,
                order: [['date', 'DESC']]
              }
            ]
          }
        ]
      });

      if (!portfolio) {
        throw new Error('投资组合不存在');
      }

      return portfolio;
    } catch (error) {
      throw new Error(`获取投资组合详情失败: ${error.message}`);
    }
  }

  /**
   * 记录每日收益
   */
  async recordDailyProfit(itemId, date, value, profit) {
    try {
      const [profitLog, created] = await ProfitLog.findOrCreate({
        where: {
          itemId,
          date
        },
        defaults: {
          itemId,
          date,
          value,
          profit,
          isDeleted: false
        }
      });

      if (!created) {
        // 如果记录已存在，更新值
        await profitLog.update({ value, profit });
      }

      return profitLog;
    } catch (error) {
      throw new Error(`记录收益失败: ${error.message}`);
    }
  }

  /**
   * 获取投资组合收益历史
   */
  async getPortfolioProfitHistory(portfolioId, startDate, endDate) {
    try {
      const profitHistory = await ProfitLog.findAll({
        include: [
          {
            model: PortfolioItem,
            as: 'portfolioItem',
            where: { 
              portfolioId,
              isDeleted: false 
            },
            include: [
              {
                model: Asset,
                as: 'asset',
                attributes: ['assetCode', 'name']
              }
            ]
          }
        ],
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          },
          isDeleted: false
        },
        order: [['date', 'ASC']]
      });

      return profitHistory;
    } catch (error) {
      throw new Error(`获取收益历史失败: ${error.message}`);
    }
  }

  /**
   * 计算投资组合总价值
   */
  async calculatePortfolioValue(portfolioId) {
    try {
      const portfolio = await this.getPortfolioDetails(portfolioId);
      
      let totalValue = 0;
      let totalProfit = 0;

      for (const item of portfolio.items) {
        const currentPrice = item.asset.price;
        const currentValue = item.quantity * currentPrice;
        const profit = currentValue - item.amount;
        
        totalValue += currentValue;
        totalProfit += profit;
      }

      return {
        portfolioId,
        totalValue: parseFloat(totalValue.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        profitRate: totalValue > 0 ? parseFloat(((totalProfit / (totalValue - totalProfit)) * 100).toFixed(2)) : 0
      };
    } catch (error) {
      throw new Error(`计算投资组合价值失败: ${error.message}`);
    }
  }

  /**
   * 更新资产价格
   */
  async updateAssetPrice(assetCode, newPrice, historyPriceArr = null, dateArr = null) {
    try {
      const asset = await Asset.findOne({ where: { assetCode } });
      if (!asset) {
        throw new Error(`资产 ${assetCode} 不存在`);
      }

      const updateData = { price: newPrice };
      if (historyPriceArr && dateArr) {
        updateData.historyPriceArr = historyPriceArr;
        updateData.dateArr = dateArr;
      }

      await asset.update(updateData);
      return asset;
    } catch (error) {
      throw new Error(`更新资产价格失败: ${error.message}`);
    }
  }
}

module.exports = new PortfolioService();