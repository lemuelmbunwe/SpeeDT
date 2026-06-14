const express = require("express");
const { ingestMetric, getLatestMetric } = require("../controllers/metrics.controller");
const { validateMetricIngestion, validateDeviceIdParam } = require("../middleware/validation");

const router = express.Router();

router.post("/", validateMetricIngestion, ingestMetric);
router.get("/latest/:deviceId", validateDeviceIdParam, getLatestMetric);

module.exports = router;
