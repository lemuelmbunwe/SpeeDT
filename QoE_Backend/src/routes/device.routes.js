const express = require("express");
const { registerDevice, getDevice } = require("../controllers/device.controller");
const { validateDeviceRegistration, validateDeviceIdParam } = require("../middleware/validation");

const router = express.Router();

router.post("/", validateDeviceRegistration, registerDevice);
router.get("/:deviceId", validateDeviceIdParam, getDevice);

module.exports = router;
