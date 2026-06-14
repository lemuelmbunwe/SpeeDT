const locationService = require("../services/location.service");

const trackLocation = async (req, res, next) => {
  try {
    const location = await locationService.trackLocation(req.body);
    res.status(201).json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
};

const getLocationHistory = async (req, res, next) => {
  try {
    const history = await locationService.getLocationHistory(req.params.deviceId);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  trackLocation,
  getLocationHistory,
};
