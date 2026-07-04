/**
 * Operator Authentication Middleware
 * 
 * Validates an operator's API key from the Authorization header,
 * identifies which operator they belong to, and attaches
 * operator_name to req.operator for downstream use.
 * 
 * Usage:
 *   Authorization: Bearer <operator_api_key>
 * 
 * API keys are stored in the .env file as a JSON object:
 *   OPERATOR_API_KEYS='{"MTN Cameroon":"mtn_key_abc123","Orange Cameroon":"orange_key_def456"}'
 */

const getOperatorConfig = () => {
  try {
    const raw = process.env.OPERATOR_API_KEYS;
    if (!raw) {
      throw new Error("OPERATOR_API_KEYS is not defined in .env");
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse OPERATOR_API_KEYS:", err.message);
    return {};
  }
};

/**
 * Reverse-lookup: given an API key, find the operator name.
 * Returns the operator name or null if the key is unknown.
 */
const findOperatorByKey = (apiKey) => {
  const config = getOperatorConfig();
  for (const [operatorName, key] of Object.entries(config)) {
    if (key === apiKey) {
      return operatorName;
    }
  }
  return null;
};

/**
 * Middleware: extracts Bearer token, validates it, attaches operator.
 * Places the identified operator_name on req.operatorName.
 */
const authenticateOperator = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Missing Authorization header. Use: Authorization: Bearer <operator_api_key>",
      });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return res.status(401).json({
        success: false,
        error: "Invalid Authorization format. Use: Authorization: Bearer <operator_api_key>",
      });
    }

    const apiKey = parts[1];
    const operatorName = findOperatorByKey(apiKey);

    if (!operatorName) {
      return res.status(403).json({
        success: false,
        error: "Invalid operator API key. Access denied.",
      });
    }

    // Attach the identified operator to the request
    req.operatorName = operatorName;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Authentication error",
    });
  }
};

module.exports = {
  authenticateOperator,
};