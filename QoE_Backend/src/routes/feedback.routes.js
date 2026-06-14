const express = require("express");
const { submitFeedback } = require("../controllers/feedback.controller");
const { validateFeedbackSubmission } = require("../middleware/validation");

const router = express.Router();

router.post("/", validateFeedbackSubmission, submitFeedback);

module.exports = router;
