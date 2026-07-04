const express = require("express");
const { exportDevice, exportAll, getOperators } = require("../controllers/export.controller");
const { authenticateOperator } = require("../middleware/operatorAuth");

const router = express.Router();

// All export routes require operator authentication
router.use(authenticateOperator);

// GET /api/export/device/:deviceId?format=json|csv
router.get("/device/:deviceId", exportDevice);

// GET /api/export/all?format=json|csv
router.get("/all", exportAll);

// GET /api/export/operators (list configured operators)
router.get("/operators", getOperators);

module.exports = router;