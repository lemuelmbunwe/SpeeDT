const metricsService = require("../services/metrics.service");

const ingestMetric = async (req, res, next) => {
  try {
    const metric = await metricsService.ingestMetric(req.body);
    res.status(201).json({ success: true, data: metric });
  } catch (err) {
    next(err);
  }
};

const ingestBatchMetrics = async (req, res, next) => {
  try {
    const metrics = await metricsService.ingestMetricsBatch(req.body);
    res.status(201).json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
};

const getLatestMetric = async (req, res, next) => {
  try {
    const metric = await metricsService.getLatestMetricByDevice(req.params.deviceId);
    if (!metric) {
      const error = new Error("No metrics found for this device");
      error.status = 404;
      throw error;
    }
    res.json({ success: true, data: metric });
  } catch (err) {
    next(err);
  }
};

const getMetricHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const result = await metricsService.getMetricHistory(req.params.deviceId, limit, offset);
    res.json({ success: true, data: result.rows, total: result.total });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  ingestMetric,
  ingestBatchMetrics,
  getLatestMetric,
  getMetricHistory,
};
