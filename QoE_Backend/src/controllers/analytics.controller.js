const metricsService = require("../services/metrics.service");
const analyticsService = require("../services/analytics.service");

const getAverageSpeedPerDevice = async (req, res, next) => {
  try {
    const averages = await metricsService.getAverageSpeedByDevice(req.params.deviceId);
    res.json({ success: true, data: averages });
  } catch (err) {
    next(err);
  }
};

const getAverageQoEPerDevice = async (req, res, next) => {
  try {
    const averages = await analyticsService.getAverageQoEByDevice(req.params.deviceId);
    res.json({ success: true, data: averages });
  } catch (err) {
    next(err);
  }
};

const getLatestMetricPerDevice = async (req, res, next) => {
  try {
    const metric = await analyticsService.getLatestMetricByDevice(req.params.deviceId);
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
  getAverageSpeedPerDevice,
  getAverageQoEPerDevice,
  getLatestMetricPerDevice,
};
