const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be defined in .env");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const ensureExtensions = async () => {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
};

const initDatabase = async () => {
  try {
    await ensureExtensions();
    console.log("Connected to Neon DB successfully and ensured pgcrypto extension.");
  } catch (err) {
    console.error("DB connection error:", err);
    throw err;
  }
};

pool.on("error", (err) => {
  console.error("Unexpected Postgres pool error:", err);
});

module.exports = {
  pool,
  initDatabase,
};
