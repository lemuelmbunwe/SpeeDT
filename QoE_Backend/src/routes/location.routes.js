const express = require("express");
const { trackLocation, getLocationHistory } = require("../controllers/location.controller");
const { validateLocationTracking, validateDeviceIdParam } = require("../middleware/validation");

const router = express.Router();

router.post("/", validateLocationTracking, trackLocation);
router.get("/history/:deviceId", validateDeviceIdParam, getLocationHistory);

module.exports = router;
