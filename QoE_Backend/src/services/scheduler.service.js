/**
 * Scheduler Service
 *
 * Automatically generates weekly export files for all operators.
 * Uses node-cron to run every Monday at 2:00 AM.
 *
 * Generated files are saved to:
 *   exports/{OperatorName}/{YYYY-MM-DD}/
 *
 * Each device gets one JSON file per export cycle.
 */

const cron = require("node-cron");
const exportService = require("./export.service");

/**
 * Initialize the weekly cron job.
 * Call this once when the server starts.
 */
const initWeeklyExportScheduler = () => {
  // Schedule: "0 2 * * 1" = every Monday at 2:00 AM
  // For testing during development, you can change to "*/5 * * * *" (every 5 minutes)
  cron.schedule("0 2 * * 1", async () => {
    console.log("[Scheduler] Starting weekly export generation...");
    try {
      const summary = await exportService.generateWeeklyExportFiles();
      console.log("[Scheduler] Weekly export complete:", JSON.stringify(summary, null, 2));
    } catch (err) {
      console.error("[Scheduler] Weekly export failed:", err.message);
    }
  });

  console.log("[Scheduler] Weekly export job scheduled (every Monday at 2:00 AM)");
};

/**
 * Manually trigger an export (useful for testing or for admin on demand)
 */
const triggerManualExport = async () => {
  console.log("[Scheduler] Manual export triggered...");
  const summary = await exportService.generateWeeklyExportFiles();
  console.log("[Scheduler] Manual export complete:", JSON.stringify(summary, null, 2));
  return summary;
};

module.exports = {
  initWeeklyExportScheduler,
  triggerManualExport,
};