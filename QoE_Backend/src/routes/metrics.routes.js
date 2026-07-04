const express = require("express");
const { ingestMetric, ingestBatchMetrics, getLatestMetric, getMetricHistory } = require("../controllers/metrics.controller");
const { validateMetricIngestion, validateBatchMetrics, validateDeviceIdParam } = require("../middleware/validation");

const router = express.Router();

router.post("/", validateMetricIngestion, ingestMetric);
router.post("/batch", validateBatchMetrics, ingestBatchMetrics);
router.get("/latest/:deviceId", validateDeviceIdParam, getLatestMetric);
router.get("/history/:deviceId", validateDeviceIdParam, getMetricHistory);

module.exports = router;
