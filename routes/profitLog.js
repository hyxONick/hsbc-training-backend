const Router = require('koa-router');
const ProfitLog = require('../models/PorfitLog');
const PortfolioItem = require('../models/PortfolioItem');
const { Op } = require('sequelize');
const { requireAuth, adminOnly } = require('../middleware/auth');

const router = new Router({ prefix: '/api/profit-logs' });

/**
 * @swagger
 * components:
 *   schemas:
 *     ProfitLog:
 *       type: object
 *       required:
 *         - itemId
 *       properties:
 *         id:
 *           type: integer
 *           description: 收益记录ID
 *         itemId:
 *           type: integer
 *           description: 投资组合项目ID
 *         date:
 *           type: string
 *           format: date-time
 *           description: 记录日期
 *         value:
 *           type: number
 *           format: decimal
 *           description: 当前价值
 *         profit:
 *           type: number
 *           format: decimal
 *           description: 收益金额
 *         isDeleted:
 *           type: boolean
 *           default: false
 *           description: 是否删除
 *     ProfitLogCreate:
 *       type: object
 *       required:
 *         - itemId
 *       properties:
 *         itemId:
 *           type: integer
 *         date:
 *           type: string
 *           format: date-time
 *         value:
 *           type: number
 *           format: decimal
 *         profit:
 *           type: number
 *           format: decimal
 * 
 * tags:
 *   - name: ProfitLog
 *     description: 收益记录管理
 */

/**
 * @swagger
 * /api/profit-logs:
 *   get:
 *     tags: [ProfitLog]
 *     summary: 获取所有收益记录
 *     description: 获取所有未删除的收益记录，按日期倒序排列
 *     responses:
 *       200:
 *         description: 成功获取收益记录列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProfitLog'
 */
router.get('/', async (ctx) => {
  const logs = await ProfitLog.findAll({
    where: { isDeleted: false },
    order: [['date', 'DESC']]
  });
  ctx.body = logs;
});

// GET: 根据 ID 获取收益记录
router.get('/:id', async (ctx) => {
  const log = await ProfitLog.findByPk(ctx.params.id);
  if (!log) {
    ctx.throw(404, 'Profit log not found');
  }
  ctx.body = log;
});

// GET: 根据项目ID获取收益记录
router.get('/item/:itemId', async (ctx) => {
  const logs = await ProfitLog.findAll({
    where: { 
      itemId: ctx.params.itemId,
      isDeleted: false 
    },
    order: [['date', 'DESC']]
  });
  ctx.body = logs;
});

/**
 * @swagger
 * /api/profit-logs/create:
 *   post:
 *     tags: [ProfitLog]
 *     summary: 创建收益记录
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfitLogCreate'
 *     responses:
 *       200:
 *         description: 成功创建收益记录
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfitLog'
 *       401:
 *         description: 未授权
 */
router.post('/create', requireAuth, async (ctx) => {
  const newLog = await ProfitLog.create(ctx.request.body);
  ctx.body = newLog;
});

// POST: 修改收益记录
router.post('/update/:id', requireAuth, async (ctx) => {
  const [updatedRowsCount] = await ProfitLog.update(
    ctx.request.body,
    {
      where: { id: ctx.params.id }
    }
  );

  if (updatedRowsCount === 0) {
    ctx.throw(404, 'Profit log not found');
  }

  const updatedLog = await ProfitLog.findByPk(ctx.params.id);
  ctx.body = updatedLog;
});

// POST: 逻辑删除收益记录
router.post('/delete/:id', requireAuth, async (ctx) => {
  const [updatedRowsCount] = await ProfitLog.update(
    { isDeleted: true },
    { where: { id: ctx.params.id } }
  );

  if (updatedRowsCount === 0) {
    ctx.throw(404, 'Profit log not found');
  }

  const deletedLog = await ProfitLog.findByPk(ctx.params.id);
  ctx.body = {
    message: 'Profit log logically deleted',
    log: deletedLog
  };
});

// GET: 分页 + 条件过滤搜索
router.get('/search', async (ctx) => {
  const { 
    page = 1, 
    pageSize = 10, 
    itemId,
    startDate,
    endDate,
    minProfit,
    maxProfit,
    minValue,
    maxValue
  } = ctx.query;

  const filter = { isDeleted: false };
  
  if (itemId) filter.itemId = itemId;
  
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date[Op.gte] = new Date(startDate);
    if (endDate) filter.date[Op.lte] = new Date(endDate);
  }
  
  if (minProfit || maxProfit) {
    filter.profit = {};
    if (minProfit) filter.profit[Op.gte] = parseFloat(minProfit);
    if (maxProfit) filter.profit[Op.lte] = parseFloat(maxProfit);
  }

  if (minValue || maxValue) {
    filter.value = {};
    if (minValue) filter.value[Op.gte] = parseFloat(minValue);
    if (maxValue) filter.value[Op.lte] = parseFloat(maxValue);
  }

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const limit = parseInt(pageSize);

  const { rows: items, count: total } = await ProfitLog.findAndCountAll({
    where: filter,
    limit,
    offset,
    order: [['date', 'DESC']]
  });

  ctx.body = {
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    items
  };
});

// GET: 获取指定项目的收益统计
router.get('/item/:itemId/stats', async (ctx) => {
  const itemId = ctx.params.itemId;
  
  const logs = await ProfitLog.findAll({
    where: { 
      itemId,
      isDeleted: false 
    },
    order: [['date', 'ASC']]
  });

  if (logs.length === 0) {
    ctx.body = {
      itemId,
      totalLogs: 0,
      totalProfit: 0,
      avgProfit: 0,
      maxProfit: 0,
      minProfit: 0,
      latestValue: 0,
      profitTrend: []
    };
    return;
  }

  const profits = logs.map(log => parseFloat(log.profit));
  const values = logs.map(log => parseFloat(log.value));
  
  const stats = {
    itemId,
    totalLogs: logs.length,
    totalProfit: profits.reduce((sum, profit) => sum + profit, 0),
    avgProfit: profits.reduce((sum, profit) => sum + profit, 0) / profits.length,
    maxProfit: Math.max(...profits),
    minProfit: Math.min(...profits),
    latestValue: values[values.length - 1] || 0,
    profitTrend: logs.map(log => ({
      date: log.date,
      profit: parseFloat(log.profit),
      value: parseFloat(log.value)
    }))
  };

  ctx.body = stats;
});

// GET: 获取指定时间范围的收益汇总
router.get('/summary', async (ctx) => {
  const { startDate, endDate, itemIds } = ctx.query;
  
  const filter = { isDeleted: false };
  
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date[Op.gte] = new Date(startDate);
    if (endDate) filter.date[Op.lte] = new Date(endDate);
  }

  if (itemIds) {
    const itemIdArray = itemIds.split(',').map(id => parseInt(id));
    filter.itemId = { [Op.in]: itemIdArray };
  }

  const logs = await ProfitLog.findAll({
    where: filter,
    order: [['date', 'ASC']]
  });

  const summary = {
    totalLogs: logs.length,
    totalProfit: 0,
    totalValue: 0,
    avgProfit: 0,
    profitByDate: {},
    itemStats: {}
  };

  logs.forEach(log => {
    const profit = parseFloat(log.profit);
    const value = parseFloat(log.value);
    const dateStr = log.date.toISOString().split('T')[0];

    summary.totalProfit += profit;
    summary.totalValue += value;

    // 按日期分组
    if (!summary.profitByDate[dateStr]) {
      summary.profitByDate[dateStr] = {
        date: dateStr,
        profit: 0,
        value: 0,
        count: 0
      };
    }
    summary.profitByDate[dateStr].profit += profit;
    summary.profitByDate[dateStr].value += value;
    summary.profitByDate[dateStr].count += 1;

    // 按项目分组
    if (!summary.itemStats[log.itemId]) {
      summary.itemStats[log.itemId] = {
        itemId: log.itemId,
        profit: 0,
        value: 0,
        count: 0
      };
    }
    summary.itemStats[log.itemId].profit += profit;
    summary.itemStats[log.itemId].value += value;
    summary.itemStats[log.itemId].count += 1;
  });

  summary.avgProfit = summary.totalLogs > 0 ? summary.totalProfit / summary.totalLogs : 0;
  summary.profitByDate = Object.values(summary.profitByDate);
  summary.itemStats = Object.values(summary.itemStats);

  ctx.body = summary;
});

// POST: 批量创建收益记录
router.post('/batch-create', requireAuth, async (ctx) => {
  const { logs } = ctx.request.body;
  
  if (!Array.isArray(logs)) {
    ctx.throw(400, 'Logs must be an array');
  }

  const createdLogs = await ProfitLog.bulkCreate(logs);
  ctx.body = {
    message: 'Batch create completed',
    logs: createdLogs
  };
});

// GET: 获取收益趋势图数据
router.get('/trend', async (ctx) => {
  const { 
    startDate, 
    endDate, 
    itemIds,
    groupBy = 'day' // day, week, month
  } = ctx.query;
  
  const filter = { isDeleted: false };
  
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date[Op.gte] = new Date(startDate);
    if (endDate) filter.date[Op.lte] = new Date(endDate);
  }

  if (itemIds) {
    const itemIdArray = itemIds.split(',').map(id => parseInt(id));
    filter.itemId = { [Op.in]: itemIdArray };
  }

  const logs = await ProfitLog.findAll({
    where: filter,
    order: [['date', 'ASC']]
  });

  // 根据 groupBy 参数分组数据
  const groupedData = {};
  logs.forEach(log => {
    const date = new Date(log.date);
    let key;
    
    switch (groupBy) {
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // day
        key = date.toISOString().split('T')[0];
        break;
    }

    if (!groupedData[key]) {
      groupedData[key] = {
        period: key,
        profit: 0,
        value: 0,
        count: 0
      };
    }
    
    groupedData[key].profit += parseFloat(log.profit);
    groupedData[key].value += parseFloat(log.value);
    groupedData[key].count += 1;
  });

  ctx.body = {
    groupBy,
    data: Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period))
  };
});

module.exports = router;