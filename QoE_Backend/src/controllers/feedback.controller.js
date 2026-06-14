const feedbackService = require("../services/feedback.service");

const submitFeedback = async (req, res, next) => {
  try {
    const feedback = await feedbackService.submitFeedback(req.body);
    res.status(201).json({ success: true, data: feedback });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitFeedback,
};
