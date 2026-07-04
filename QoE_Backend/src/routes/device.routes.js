const express = require("express");
const { registerDevice, getDevice, updateDevicePreferences, deleteDeviceData } = require("../controllers/device.controller");
const { validateDeviceRegistration, validateDeviceIdParam } = require("../middleware/validation");

const router = express.Router();

router.post("/", validateDeviceRegistration, registerDevice);
router.get("/:deviceId", validateDeviceIdParam, getDevice);
router.put("/:deviceId/preferences", validateDeviceIdParam, updateDevicePreferences);
router.delete("/:deviceId/data", validateDeviceIdParam, deleteDeviceData);

module.exports = router;
