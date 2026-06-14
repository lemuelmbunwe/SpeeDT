const sanitizeUUID = (value) => {
  if (typeof value !== "string") return value;
  return value.trim().replace(/^<|>$/g, "");
};

const isValidUUID = (value) => {
  if (typeof value !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value.trim());
};

const validateFields = (source, requiredFields) => {
  const missing = requiredFields.filter((field) => source[field] === undefined || source[field] === null);
  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
};

const validateDeviceRegistration = (req, res, next) => {
  try {
    validateFields(req.body, ["device_model", "os", "app_version"]);
    next();
  } catch (err) {
    next(err);
  }
};

const validateMetricIngestion = (req, res, next) => {
  try {
    validateFields(req.body, ["anonymous_id", "network_type"]);
    const anonymousId = sanitizeUUID(req.body.anonymous_id);
    if (!isValidUUID(anonymousId)) {
      const error = new Error("anonymous_id must be a valid UUID");
      error.status = 400;
      throw error;
    }
    req.body.anonymous_id = anonymousId;
    next();
  } catch (err) {
    next(err);
  }
};

const validateLocationTracking = (req, res, next) => {
  try {
    validateFields(req.body, ["anonymous_id", "latitude", "longitude"]);
    const anonymousId = sanitizeUUID(req.body.anonymous_id);
    if (!isValidUUID(anonymousId)) {
      const error = new Error("anonymous_id must be a valid UUID");
      error.status = 400;
      throw error;
    }
    req.body.anonymous_id = anonymousId;
    next();
  } catch (err) {
    next(err);
  }
};

const validateFeedbackSubmission = (req, res, next) => {
  try {
    validateFields(req.body, [
      "anonymous_id",
      "overall_rating",
      "speed_rating",
      "delay_rating",
      "reliability_rating",
    ]);
    const anonymousId = sanitizeUUID(req.body.anonymous_id);
    if (!isValidUUID(anonymousId)) {
      const error = new Error("anonymous_id must be a valid UUID");
      error.status = 400;
      throw error;
    }
    req.body.anonymous_id = anonymousId;

    if (req.body.metric_id !== null && req.body.metric_id !== undefined) {
      const parsedMetricId = Number(req.body.metric_id);
      if (Number.isNaN(parsedMetricId) || parsedMetricId <= 0) {
        const error = new Error("metric_id must be a positive integer or null");
        error.status = 400;
        throw error;
      }
      req.body.metric_id = parsedMetricId;
    }

    next();
  } catch (err) {
    next(err);
  }
};

const validateDeviceIdParam = (req, res, next) => {
  const { deviceId } = req.params;
  if (!deviceId) {
    const err = new Error("Device ID is required");
    err.status = 400;
    return next(err);
  }
  const sanitizedDeviceId = sanitizeUUID(deviceId);
  if (!isValidUUID(sanitizedDeviceId)) {
    const err = new Error("deviceId must be a valid UUID");
    err.status = 400;
    return next(err);
  }
  req.params.deviceId = sanitizedDeviceId;
  next();
};

module.exports = {
  validateDeviceRegistration,
  validateMetricIngestion,
  validateLocationTracking,
  validateFeedbackSubmission,
  validateDeviceIdParam,
};
