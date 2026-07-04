const fs = require("fs");
const path = require("path");
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
    const schemaPath = path.join(__dirname, "../../database/schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    await pool.query(schemaSql);

    const seedPath = path.join(__dirname, "../../database/seed.sql");
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, "utf8");
      await pool.query(seedSql);
    }

    console.log("Connected to PostgreSQL successfully and initialized the application schema.");
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
