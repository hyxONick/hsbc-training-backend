const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetInfo = sequelize.define('AssetInfo', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  assetCode: { type: DataTypes.STRING(20), allowNull: false },
  name: { type: DataTypes.STRING(100) },
  assetType: { type: DataTypes.ENUM('stock', 'bond', 'cash'), allowNull: false },
  price: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
  currency: { type: DataTypes.STRING(10) },
  updatedAt: { type: DataTypes.DATE },
  historyPriceArr: { // ✅ 存历史价格数组
  type: DataTypes.JSON,
  validate: {
    isArrayOfNumbers(value) {
      if (!Array.isArray(value)) {
        throw new Error('historyPriceArt must be array');
      }
      if (!value.every(v => typeof v === 'number')) {
        throw new Error('historyPriceArt must be number');
      }
    }
  }
},
dateArr: { // ✅ 存历史时间数组
  type: DataTypes.JSON,
  validate: {
    isArrayOfStrings(value) {
      if (!Array.isArray(value)) {
        throw new Error('historyPriceArt must be array');
      }
      if (!value.every(v => typeof v === 'string')) {
        throw new Error('dateArr must be date(string)');
      }
    }
  }
},    
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'asset_info',
  timestamps: false
});

module.exports = AssetInfo;
