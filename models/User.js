const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user',
  },
  avatar: {
    type: DataTypes.TEXT('long'),   // ✅ 存 Base64 图片数据
    allowNull: true
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: true, // 自动添加 createdAt, updatedAt
});

module.exports = User;
