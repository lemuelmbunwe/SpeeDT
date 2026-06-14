require("dotenv").config();
const app = require("./src/app");
const { initDatabase } = require("./src/config/db");

const PORT = process.env.PORT || 5000;

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`QoE Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server because database initialization failed.", err);
    process.exit(1);
  });
