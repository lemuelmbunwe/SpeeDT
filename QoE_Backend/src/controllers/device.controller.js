const deviceService = require("../services/device.service");

const registerDevice = async (req, res, next) => {
  try {
    const device = await deviceService.registerDevice(req.body);
    res.status(201).json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
};

const getDevice = async (req, res, next) => {
  try {
    const device = await deviceService.getDeviceById(req.params.deviceId);
    if (!device) {
      const error = new Error("Device not found");
      error.status = 404;
      throw error;
    }
    res.json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
};

const updateDevicePreferences = async (req, res, next) => {
  try {
    const device = await deviceService.updateDevicePreferences(req.params.deviceId, req.body);
    if (!device) {
      const error = new Error("Device not found");
      error.status = 404;
      throw error;
    }
    res.json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
};

const deleteDeviceData = async (req, res, next) => {
  try {
    await deviceService.deleteDeviceData(req.params.deviceId);
    res.json({ success: true, message: "All device data deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerDevice,
  getDevice,
  updateDevicePreferences,
  deleteDeviceData,
};
