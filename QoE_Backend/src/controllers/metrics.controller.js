const metricsService = require("../services/metrics.service");

const ingestMetric = async (req, res, next) => {
  try {
    const metric = await metricsService.ingestMetric(req.body);
    res.status(201).json({ success: true, data: metric });
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

module.exports = {
  ingestMetric,
  getLatestMetric,
};
