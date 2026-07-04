const express = require("express");
const {
  getAverageSpeedPerDevice,
  getAverageQoEPerDevice,
  getLatestMetricPerDevice,
  getTrendPerDevice,
} = require("../controllers/analytics.controller");
const { validateDeviceIdParam } = require("../middleware/validation");

const router = express.Router();

router.get("/average-speed/:deviceId", validateDeviceIdParam, getAverageSpeedPerDevice);
router.get("/average-qoe/:deviceId", validateDeviceIdParam, getAverageQoEPerDevice);
router.get("/latest-metric/:deviceId", validateDeviceIdParam, getLatestMetricPerDevice);
router.get("/trend/:deviceId", validateDeviceIdParam, getTrendPerDevice);

module.exports = router;
