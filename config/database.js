const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DB_NAME || 'node_db',
  process.env.MYSQL_DB_USER || 'root',
  process.env.MYSQL_DB_PASS || 'root',
  {
    host: process.env.MYSQL_DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = sequelize;
