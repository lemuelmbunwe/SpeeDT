# SpeeDT — QoE Monitoring System: Complete Implementation Guide

> **Author:** Cline (AI Assistant)  
> **Date:** June 15, 2026  
> **Purpose:** This document explains every decision made, file created, and architecture choice for the SpeeDT QoE Monitoring System backend and database implementation. It is intended for your development partner to review and understand the full scope of work.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Database Schema (4 Tables)](#2-database-schema)
3. [Seed Data & Sample Records](#3-seed-data)
4. [Application Queries (Screen-by-Screen)](#4-application-queries)
5. [Backend Architecture (Node.js + Express)](#5-backend-architecture)
6. [Operator Data Export System](#6-operator-data-export-system)
7. [How Operator Authentication Works](#7-how-operator-authentication-works)
8. [How Operator Data Isolation Works](#8-how-operator-data-isolation-works)
9. [Three Export Methods Explained](#9-three-export-methods-explained)
10. [Complete File Inventory](#10-complete-file-inventory)
11. [How to Run Everything](#11-how-to-run-everything)
12. [Future Considerations](#12-future-considerations)

---

## 1. Project Overview

**SpeeDT** is a crowdsensed QoE (Quality of Experience) network monitoring application. It consists of two main parts:

| Part | Location | Tech Stack |
|------|----------|------------|
| **Frontend (Mobile App)** | `SpeedDT/` | React Native, Expo 54, NativeWind, TypeScript |
| **Backend (API Server)** | `QoE_Backend/` | Node.js, Express 5, PostgreSQL (Neon), node-cron |

### What Existed Before This Work

The frontend had **6 complete screens** (Onboarding, Consent, Home, History, Test, Settings) but **all data was hardcoded** — every screen displayed `MOCK.*` objects. There was no database, no real API, no persistence.

The backend was started with **17 files** (routes, controllers, services, middleware, DB config) and was already connected to a **Neon PostgreSQL** cloud database. It could register devices, ingest metrics, track locations, submit feedback, and return basic analytics. However, it was missing:
- A complete database schema (tables needed to be created)
- The history/trend endpoints needed by the mobile screens
- The batch upload endpoint (for every 5-minute collection → hourly upload)
- **Any data export mechanism for network operators** (this was the main request)

### What Was Built

| Phase | Deliverable | Files |
|-------|-------------|-------|
| **Phase 1: Data Design** | ER Diagram, 4 entities merged from ChatGPT + codebase analysis | — |
| **Phase 2: Database Schema** | Full SQL schema with PKs, FKs, indexes, constraints | `database/schema.sql` |
| **Phase 3: Seed Data** | Realistic sample data matching the app's mock values | `database/seed.sql` |
| **Phase 4: Application Queries** | 20+ SQL queries mapped to each screen | `database/queries.sql` |
| **Phase 5: Operator Auth** | Bearer token middleware that identifies which operator is calling | `src/middleware/operatorAuth.js` |
| **Phase 6: Export Service** | Core logic for JSON + CSV export with operator filtering | `src/services/export.service.js` |
| **Phase 7: Export Controller** | Request handlers for device and bulk export | `src/controllers/export.controller.js` |
| **Phase 8: Export Routes** | 3 route endpoints, all protected by auth | `src/routes/export.routes.js` |
| **Phase 9: Weekly Scheduler** | Automated exports every Monday at 2 AM using node-cron | `src/services/scheduler.service.js` |
| **Phase 10: Config Updates** | .env, app.js, package.json, .gitignore, test.rest | 5 files modified |

---

## 2. Database Schema

**File:** `database/schema.sql`

The database is named `QoE_Monitoring_System` and contains **4 tables**. The design merges entities from ChatGPT's proposal and the codebase analysis of all 6 screens.

### Why These 4 Tables?

The ChatGPT proposal had 4 entities: `Subscriber_Device`, `Network_Metric`, `Location`, and `Feedback`. The codebase analysis revealed that the Settings screen manages consent and preference toggles — these were added directly into `subscriber_device` instead of creating a separate `user_preferences` table (keeping the schema simpler). Additionally, ChatGPT's `Network_Metric` already had all the columns needed for **both** speed tests and passive network monitoring, so a separate `NetworkSession` table was not needed.

### Table 1: `subscriber_device`

| Column | Type | Constraints | Why It Exists |
|--------|------|-------------|---------------|
| `anonymous_id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Anonymized identity for crowdsensing — no personal info stored |
| `device_model` | VARCHAR(100) | NOT NULL | e.g., "iPhone 15 Pro", "Samsung Galaxy S24" |
| `os` | VARCHAR(50) | NOT NULL | e.g., "iOS 18.2", "Android 15.0" |
| `app_version` | VARCHAR(20) | NOT NULL | e.g., "1.0.0" — helps track which app version generated the data |
| `consent_given` | BOOLEAN | DEFAULT false | Set to true when user taps "I AGREE & CONTINUE" on Consent screen |
| `data_collection_enabled` | BOOLEAN | DEFAULT true | Settings toggle: "Allow background sensing" |
| `wifi_only_uploads` | BOOLEAN | DEFAULT false | Settings toggle: "Save cellular data" |
| `notifications_enabled` | BOOLEAN | DEFAULT false | Settings toggle: "Network anomaly alerts" |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | When the device was first registered |

**Index:** `idx_subscriber_device_consent` on `consent_given` — for admin queries to find consented devices.

### Table 2: `network_metric`

| Column | Type | Constraints | Why It Exists |
|--------|------|-------------|---------------|
| `metric_id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID for each measurement |
| `anonymous_id` | UUID | FOREIGN KEY → subscriber_device | Which device took this measurement |
| `network_type` | VARCHAR(30) | NULLABLE | e.g., "5G NSA", "4G LTE", "Wi-Fi", "No Service" |
| `operator_name` | VARCHAR(50) | NULLABLE | e.g., "MTN Cameroon", "Orange Cameroon", "Starlink Network" |
| `signal_strength_dbm` | INTEGER | NULLABLE | e.g., -65 dBm (higher/closer to 0 is better) |
| `download_mbps` | DECIMAL(8,2) | NULLABLE | Download speed. NULL if this is a passive snapshot, not a speed test |
| `upload_mbps` | DECIMAL(8,2) | NULLABLE | Upload speed. NULL if passive snapshot |
| `latency_ms` | DECIMAL(6,2) | NULLABLE | Ping in milliseconds |
| `jitter_ms` | DECIMAL(5,2) | NULLABLE | Variation in latency |
| `packet_loss_pct` | DECIMAL(4,2) | NULLABLE | Percentage of lost packets |
| `recorded_at` | TIMESTAMPTZ | DEFAULT NOW() | When the measurement was taken |

**Key Design Decision:** This single table handles **two types of data**:
1. **Speed tests** — rows with `download_mbps`, `upload_mbps`, `latency_ms` populated (from Test screen)
2. **Passive network snapshots** — rows where those are NULL but `signal_strength_dbm` is populated (from background monitoring every 5 minutes)

This avoids needing a separate `NetworkSession` table and makes trend queries simpler.

**Indexes:**
- `idx_network_metric_device` on `(anonymous_id, recorded_at DESC)` — fast lookups for "get my recent tests"
- `idx_network_metric_trend` on `(anonymous_id, (recorded_at::date))` — fast daily aggregation for the trend chart

### Table 3: `location`

| Column | Type | Constraints | Why It Exists |
|--------|------|-------------|---------------|
| `location_id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing |
| `anonymous_id` | UUID | FOREIGN KEY → subscriber_device | Which device was at this location |
| `latitude` | DECIMAL(9,6) | NOT NULL | GPS latitude |
| `longitude` | DECIMAL(9,6) | NOT NULL | GPS longitude |
| `location_name` | VARCHAR(100) | NULLABLE | Human-readable name from reverse geocoding or manual input |
| `recorded_at` | TIMESTAMPTZ | DEFAULT NOW() | When the location was recorded |

**Indexes:**
- `idx_location_device` on `(anonymous_id, recorded_at DESC)` — get location history for a device
- `idx_location_coordinates` on `(latitude, longitude)` — spatial queries for coverage mapping

### Table 4: `feedback`

| Column | Type | Constraints | Why It Exists |
|--------|------|-------------|---------------|
| `feedback_id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing |
| `anonymous_id` | UUID | FOREIGN KEY → subscriber_device | Who gave this feedback |
| `metric_id` | BIGINT | FOREIGN KEY → network_metric, NULLABLE | Optional link to a specific speed test |
| `overall_rating` | SMALLINT | CHECK (1–5) | Overall satisfaction |
| `speed_rating` | SMALLINT | CHECK (1–5) | Speed satisfaction |
| `delay_rating` | SMALLINT | CHECK (1–5) | Delay/latency satisfaction |
| `reliability_rating` | SMALLINT | CHECK (1–5) | Reliability satisfaction |
| `comment` | TEXT | NULLABLE | Free-text optional comment |
| `recorded_at` | TIMESTAMPTZ | DEFAULT NOW() | When feedback was submitted |

**Indexes:**
- `idx_feedback_device` on `(anonymous_id, recorded_at DESC)` — get feedback for a device
- `idx_feedback_ratings` on all rating columns — aggregate rating analysis

### Entity Relationship Diagram (Text)

```
subscriber_device (1) ────── (many) network_metric
subscriber_device (1) ────── (many) location
subscriber_device (1) ────── (many) feedback
network_metric (1) ── (0..1) feedback  (optional, metric_id can be NULL)
```

### SQL Foreign Key Rules

- `ON DELETE CASCADE` on all FKs — deleting a device removes all its associated data
- `ON DELETE SET NULL` on feedback's `metric_id` — deleting a metric keeps the feedback but unlinks it

### How to Create the Database

1. Open pgAdmin (or any PostgreSQL client)
2. Create a new database called `QoE_Monitoring_System`
3. Open `database/schema.sql` in the query tool
4. Execute the entire script — it creates all 4 tables with indexes

---

## 3. Seed Data

**File:** `database/seed.sql`

Contains realistic sample data that exactly matches the hardcoded values in the mobile app's screens.

### Devices (2)
- **iPhone 15 Pro** (iOS 18.2) — Device ID: `a1b2c3d4-...` — MTN Cameroon subscriber, consent given
- **Samsung Galaxy S24** (Android 15.0) — Device ID: `b2c3d4e5-...` — Orange Cameroon subscriber

### Network Metrics (17 rows)
All the speeds and values from the app's mock data are represented:

| Source | Mock Value | Seed Row |
|--------|-----------|----------|
| HomeScreen current | 142 down, 48.2 up, 12 ping | Latest metric (2 min ago) |
| HomeScreen recent 1 | Downtown Core, 138 Mbps | 2 hours ago |
| HomeScreen recent 2 | Business District, 112 Mbps | 1 day ago |
| HomeScreen recent 3 | Transit Hub, 95 Mbps | 2 days ago |
| TestScreen result | 150.5 down, 45.2 up, 22 ping, 4 jitter | 1 hour ago |
| HistoryScreen Molyko | 85.4 Mbps, 5G NSA | 5 hours ago |
| HistoryScreen Clerks | 32.1 Mbps, 4G LTE | 1 day ago |
| HistoryScreen Buea | No Service, -- speeds | 3 days ago |
| Additional for averaging | 42.5, 38.2, 18.5 Mbps | 4–6 days ago |
| Passive snapshots (3) | Signal only, no speed test | 30 min, 45 min, 3 hours |

### Locations (9)
Latitude/longitude for all locations mentioned in the mock data: Downtown Core, Business District, Transit Hub, Molyko, Clerks Quarters, Buea Highway (Device 1) + Douala Centre, Bonanjo, Akwa (Device 2).

### Feedback (7)
Including ratings and comments that mirror real user sentiment — both linked to specific speed tests (3) and standalone (4).

---

## 4. Application Queries

**File:** `database/queries.sql`

Contains **20+ SQL queries** organized by screen. Here's the mapping:

### HomeScreen Queries (4 queries)
1. **Latest network status** — Get current download, upload, ping, signal, network type, operator
2. **Recent 3 tests** — Skip the latest, get the 3 before that (for "Recent Tests" list)
3. **Reliability score** — Percentage of tests with latency < 50ms (shown as "Reliability Score /100")
4. **Current signal snapshot** — Latest passive monitoring row (non-speed-test data)

### TestScreen Queries (2 queries)
1. **Save new speed test** — INSERT with RETURNING metric_id
2. **Get connection info** — Latest network+operator info for the connection display

### HistoryScreen Queries (3 queries)
1. **Summary stats** — AVG download, MAX download (for the "Avg Download" and "Peak Recorded" cards)
2. **7-day trend** — Daily averages of download speed and signal strength (for the trend chart)
3. **Paginated records** — Full list with JOIN to location for location_name (for "Recent Records" list)
4. **Total count** — For pagination "View All Records"

### SettingsScreen Queries (2 queries)
1. **Load preferences** — SELECT consent_given, data_collection_enabled, wifi_only_uploads, notifications_enabled
2. **Update preferences** — UPDATE statement for saving toggles

### ConsentScreen Queries (3 queries)
1. **Register new device** — INSERT returning anonymous_id
2. **Grant consent** — UPDATE consent_given = true
3. **Check consent status** — For re-launch detection (skip onboarding if already consented)

### Feedback Queries (2 queries)
1. **Submit linked feedback** — With optional metric_id
2. **Submit standalone feedback** — Without metric_id

### Admin/Analytics Queries (3 queries)
1. **Coverage map** — All locations with signal strength and download speed
2. **Ratings per location** — Average of all 4 ratings grouped by location
3. **Operator comparison** — AVG download/upload/latency grouped by operator

---

## 5. Backend Architecture

**Directory:** `QoE_Backend/`

### Layered Architecture

```
├── server.js                  Entry point (starts server, inits DB)
├── src/
│   ├── app.js                 Express app setup (routes, middleware)
│   ├── config/
│   │   └── db.js              PostgreSQL pool connection (Neon)
│   ├── routes/                HTTP route definitions
│   │   ├── device.routes.js   POST /api/devices, GET /api/devices/:id
│   │   ├── metrics.routes.js  POST /api/metrics, GET /api/metrics/latest/:id
│   │   ├── location.routes.js POST /api/locations, GET /api/locations/history/:id
│   │   ├── feedback.routes.js POST /api/feedback
│   │   ├── analytics.routes.js GET /api/analytics/average-speed/:id, etc.
│   │   └── export.routes.js   GET /api/export/device/:id, /all, /operators (NEW)
│   ├── controllers/           Request handlers (parses req, calls service, sends res)
│   │   ├── device.controller.js
│   │   ├── metrics.controller.js
│   │   ├── location.controller.js
│   │   ├── feedback.controller.js
│   │   ├── analytics.controller.js
│   │   └── export.controller.js (NEW)
│   ├── services/              Business logic (queries DB, transforms data)
│   │   ├── device.service.js
│   │   ├── metrics.service.js
│   │   ├── location.service.js
│   │   ├── feedback.service.js
│   │   ├── analytics.service.js
│   │   ├── export.service.js (NEW)
│   │   └── scheduler.service.js (NEW)
│   └── middleware/            Express middleware
│       ├── errorHandler.js    Global error handler
│       ├── validation.js      Input validation (UUID checks, required fields)
│       └── operatorAuth.js    (NEW) Bearer token → operator identification
├── .env                       Database URL + operator API keys
├── .gitignore                 Node modules + exports
├── package.json               Dependencies (express, pg, dotenv, node-cron, cors)
├── test.rest                  VS Code REST client test file
└── exports/                   Auto-generated weekly export files (NEW)
    └── .gitkeep
```

### Data Flow

```
Mobile App (React Native)                    Backend (Node.js + Express)               Database (Neon PostgreSQL)
       │                                           │                                        │
       │── POST /api/metrics (every 5 min) ──────►│── INSERT INTO network_metric ────────►│
       │                                           │                                        │
       │── POST /api/metrics/batch (hourly) ─────►│── INSERT multiple rows ──────────────►│
       │                                           │                                        │
       │── GET /api/analytics/latest-metric ─────►│── SELECT ... ORDER BY DESC LIMIT 1 ──►│
       │◄── { download: 142, upload: 48.2,... } ──│                                        │
       │                                           │                                        │
Operator Dashboard                             │                                        │
       │                                           │                                        │
       │── GET /api/export/all (with Bearer) ────►│── authenticateOperator() ────────────►│
       │                                           │── SELECT WHERE operator = 'MTN' ────►│
       │◄── { network_metrics: [...], ... } ──────│                                        │
```

---

## 6. Operator Data Export System

**This is the main new feature.** Network operators (MTN, Orange, Camtel) need to receive the crowdsensed data for their own subscribers. The system implements **3 export methods** with **API-key authentication** and **automatic data filtering**.

### Why API Keys Instead of Passwords?

- Operators are organizations, not individual users — they don't have logins
- API keys are machine-friendly (used in scripted `curl` requests)
- Each operator gets one key, embedded in their integration
- Keys are stored in `.env` as a JSON object, not in the database

### The 3 Export Methods

| Method | Endpoint | When to Use | Format |
|--------|----------|-------------|--------|
| **1. Per-Device Export** | `GET /api/export/device/:id?format=json` | Operator wants data for a specific device | Single JSON document |
| **2. Bulk Export** | `GET /api/export/all?format=json` | Operator wants all their subscribers at once | JSON array, or CSV with all tables |
| **3. Automated Weekly** | Cron: Monday 2 AM → saves to `exports/` | Hands-off, files ready for pickup | One JSON file per device per operator |

---

## 7. How Operator Authentication Works

**File:** `src/middleware/operatorAuth.js`

### Step-by-Step Flow

```
Request: GET /api/export/all
Header: Authorization: Bearer mtn_api_key_demo_abc123

1. Middleware reads Authorization header
2. Extracts "Bearer mtn_api_key_demo_abc123"
3. Splits into ["Bearer", "mtn_api_key_demo_abc123"]
4. Calls findOperatorByKey("mtn_api_key_demo_abc123")
5. Looks up in config: {"MTN Cameroon": "mtn_api_key_demo_abc123", ...}
6. Match found → req.operatorName = "MTN Cameroon"
7. Calls next() — passes control to the controller
8. Controller calls exportService.exportAllForOperatorAsJson("MTN Cameroon")
9. Service queries: SELECT WHERE operator_name = 'MTN Cameroon'
10. Returns ONLY MTN data
```

### What Happens With Invalid Keys

| Scenario | Response |
|----------|----------|
| No Authorization header | 401: "Missing Authorization header" |
| Wrong format (e.g., "Basic xxx") | 401: "Invalid Authorization format" |
| Unknown API key | 403: "Invalid operator API key. Access denied." |
| Valid key, no data for operator | 404: "No devices found for your operator" |

### .env Configuration

```env
OPERATOR_API_KEYS='{"MTN Cameroon":"mtn_api_key_demo_abc123",
                     "Orange Cameroon":"orange_api_key_demo_def456",
                     "Camtel":"camtel_api_key_demo_ghi789"}'
```

Each key is a plain string. In production, replace the demo keys with cryptographically random strings (use `openssl rand -hex 32` or similar).

---

## 8. How Operator Data Isolation Works

This is the **critical security feature** — one operator must never see another operator's data.

### The Mechanism

Every `network_metric` row has an `operator_name` column (e.g., "MTN Cameroon"). All export queries filter by this column using the operator name derived from the API key.

### Single Device Export

When MTN requests `GET /api/export/device/a1b2c3d4-...`:
```sql
SELECT * FROM network_metric
WHERE anonymous_id = 'a1b2c3d4-...'
  AND operator_name = 'MTN Cameroon'    ← Automatic filter!
```

Even if MTN guesses Orange's device ID, the query returns **zero rows** because that device's metrics have `operator_name = 'Orange Cameroon'`.

### Bulk Export

When Orange requests `GET /api/export/all`:
```sql
SELECT DISTINCT anonymous_id FROM network_metric
WHERE operator_name = 'Orange Cameroon'    ← Only Orange's devices
```

Then for each device, all data is fetched — but always filtered by operator_name.

### Security Diagram

```
Operator MTN's API key → req.operatorName = "MTN Cameroon"
     │
     ▼
All queries automatically append: WHERE operator_name = 'MTN Cameroon'
     │
     ▼
MTN sees:
  ┌─────────────────────────────────────┐
  │ Device A (MTN subscriber) — 142 rows │
  │ Device B (MTN subscriber) — 85 rows  │
  └─────────────────────────────────────┘

Operator Orange's API key → req.operatorName = "Orange Cameroon"
     │
     ▼
Orange sees:
  ┌──────────────────────────────────────┐
  │ Device C (Orange subscriber) — 56 rows│
  │ Device D (Orange subscriber) — 23 rows│
  └──────────────────────────────────────┘
```

---

## 9. Three Export Methods Explained

### Method 1: Self-Service per Device (JSON)

**Endpoint:** `GET /api/export/device/:deviceId?format=json`

Returns a comprehensive JSON document with 5 sections:

```json
{
  "export_metadata": {
    "generated_at": "2026-06-15T10:00:00Z",
    "operator": "MTN Cameroon",
    "device_id": "a1b2c3d4-...",
    "total_metrics": 142,
    "total_locations": 12,
    "total_feedback": 7,
    "date_range": {
      "from": "2026-01-01T00:00:00Z",
      "to": "2026-06-15T10:00:00Z"
    }
  },
  "device_info": { ... },
  "network_metrics": [ ... ],
  "locations": [ ... ],
  "feedback": [ ... ],
  "summary": {
    "avg_download_mbps": 85.3,
    "avg_upload_mbps": 28.1,
    "avg_latency_ms": 24.5,
    "total_speed_tests": 142,
    "operators_detected": ["MTN Cameroon"],
    "coverage_locations": ["Downtown Core", "Molyko", "Buea Highway"],
    "network_types_encountered": ["5G NSA", "4G LTE", "3G"]
  }
}
```

**Use case:** An operator analyst wants to investigate a specific device's performance. They call this endpoint, get a complete picture.

### Method 2: Self-Service Bulk (CSV)

**Endpoint:** `GET /api/export/all?format=csv`

Returns a downloadable CSV file containing **3 sections** concatenated:
1. Network metrics (all columns)
2. Locations (all columns)
3. Feedback (all columns)

**Use case:** An operator wants to load all subscriber data into Excel, Tableau, or their own analytics platform. CSV is the universal format for data import.

### Method 3: Automated Weekly Export

**Scheduler:** Runs every Monday at 2:00 AM via `node-cron`

**What it does:**
1. Reads all operator names from `.env` configuration
2. For each operator, finds all their devices
3. For each device, generates a complete JSON export file
4. Saves to `exports/{OperatorName}/{YYYY-MM-DD}/{deviceId}.json`
5. Logs a summary of what was generated

**File structure:**
```
exports/
├── MTN_Cameroon/
│   └── 2026-06-15/
│       ├── a1b2c3d4-....json
│       └── f5e6d7c8-....json
├── Orange_Cameroon/
│   └── 2026-06-15/
│       └── b2c3d4e5-....json
└── .gitkeep
```

**Use case:** Operators who don't want to call APIs can simply pick up files from the server. These files can be served via a simple static file server or SFTP.

---

## 10. Complete File Inventory

### Database Files (in `SpeedDT/database/`)

| File | Lines | Description |
|------|-------|-------------|
| `schema.sql` | ~220 | Full CREATE TABLE script with all 4 tables, indexes, constraints, comments |
| `seed.sql` | ~130 | Realistic sample data: 2 devices, 17 metrics, 9 locations, 7 feedbacks |
| `queries.sql` | ~280 | 20+ application queries organized per screen |

### Backend Files (in `QoE_Backend/`)

| File | Lines | Description |
|------|-------|-------------|
| `server.js` | 16 | Entry point, starts Express + connects Neon DB |
| `src/app.js` | 35 | Express app with all routes mounted + scheduler init |
| `src/config/db.js` | 35 | PostgreSQL Pool connection with pgcrypto extension |
| `src/routes/device.routes.js` | 10 | POST + GET device endpoints |
| `src/routes/metrics.routes.js` | 10 | POST metric, GET latest |
| `src/routes/location.routes.js` | 10 | POST location, GET history |
| `src/routes/feedback.routes.js` | 9 | POST feedback |
| `src/routes/analytics.routes.js` | 15 | GET average-speed, average-qoe, latest-metric |
| `src/routes/export.routes.js` | 15 | **NEW** GET export/device, /all, /operators |
| `src/controllers/device.controller.js` | 29 | Register + get device |
| `src/controllers/metrics.controller.js` | 29 | Ingest + get latest metric |
| `src/controllers/location.controller.js` | 24 | Track + get location history |
| `src/controllers/feedback.controller.js` | 14 | Submit feedback |
| `src/controllers/analytics.controller.js` | 40 | Average speed, QoE, latest metric |
| `src/controllers/export.controller.js` | 86 | **NEW** Export device, all, list operators |
| `src/services/device.service.js` | 50 | SQL queries for device CRUD |
| `src/services/metrics.service.js` | 69 | SQL queries for metrics |
| `src/services/location.service.js` | 33 | SQL queries for locations |
| `src/services/feedback.service.js` | 38 | SQL queries for feedback |
| `src/services/analytics.service.js` | 28 | SQL queries for analytics |
| `src/services/export.service.js` | 270 | **NEW** Core export logic (JSON + CSV + file gen) |
| `src/services/scheduler.service.js` | 36 | **NEW** Weekly cron job |
| `src/middleware/errorHandler.js` | 17 | Global Express error handler |
| `src/middleware/validation.js` | 118 | UUID validation, required field checks |
| `src/middleware/operatorAuth.js` | 75 | **NEW** Bearer token → operator identification |
| `.env` | 6 | Database URL + operator API keys |
| `test.rest` | 98 | All API endpoint test examples including exports |

### Export Files Directory

| File | Description |
|------|-------------|
| `exports/.gitkeep` | Empty file to keep directory in git |

---

## 11. How to Run Everything

### Prerequisites

- Node.js 18+
- PostgreSQL (local pgAdmin or Neon cloud)
- npm

### Step 1: Create the Database

```sql
-- In pgAdmin Query Tool, run:
CREATE DATABASE "QoE_Monitoring_System";

-- Then run the schema:
-- Open database/schema.sql and execute
-- Then run database/seed.sql to insert sample data
```

### Step 2: Configure Backend

```bash
cd QoE_Backend
# Edit .env if needed — DATABASE_URL points to your PostgreSQL
# The OPERATOR_API_KEYS can be customized
```

### Step 3: Install & Start

```bash
cd QoE_Backend
npm install
npm run dev
# Server starts on port 5050 (or PORT in .env)
```

### Step 4: Test Endpoints

Open `test.rest` in VS Code with the REST Client extension and click "Send Request" on any endpoint.

#### Quick Test Sequence for Exports

```bash
# 1. Register a device
POST http://localhost:5050/api/devices
Content-Type: application/json
{ "device_model": "Pixel 8", "os": "Android 15", "app_version": "1.0" }

# 2. Ingest a metric (use the anonymous_id returned above)
POST http://localhost:5050/api/metrics
Content-Type: application/json
{ "anonymous_id": "<id-from-step-1>", "network_type": "5G", "operator_name": "MTN Cameroon", "download_mbps": 100, "upload_mbps": 20, "latency_ms": 15 }

# 3. Export as MTN operator (replace deviceId with yours)
GET http://localhost:5050/api/export/device/<deviceId>?format=json
Authorization: Bearer mtn_api_key_demo_abc123

# 4. Try same with Orange key — should return 404
GET http://localhost:5050/api/export/device/<deviceId>?format=json
Authorization: Bearer orange_api_key_demo_def456
```

---

## 12. Future Considerations

### What's Still Missing

| Feature | Priority | Why |
|---------|----------|-----|
| **Batch metrics upload** | High | Mobile app collects every 5 min, uploads hourly — needs `POST /api/metrics/batch` |
| **History with pagination** | High | HistoryScreen needs `GET /api/metrics/history/:id?page=1&limit=20` |
| **Trend data endpoint** | Medium | HistoryScreen chart needs `GET /api/analytics/trend/:id?days=7` |
| **Settings update** | Medium | SettingsScreen needs `PUT /api/devices/:id/preferences` |
| **HomeScreen combined API** | Medium | One endpoint returning latest metric + recent 3 + reliability = saves 3 separate calls |
| **Admin dashboard** | Low | A simple web page listing devices with "Export" buttons |
| **Data retention policy** | Low | Auto-delete data older than X months to save space |
| **Rate limiting** | Low | Prevent abuse of export endpoints |
| **HTTPS** | Medium | Required for production — use a reverse proxy like Nginx |

### Migration to Production

1. **Replace demo API keys** in `.env` with cryptographically secure keys
2. **Enable HTTPS** — never send API keys over plain HTTP
3. **Add rate limiting** — `express-rate-limit` to prevent export abuse
4. **Consider Supabase/Neon** — both support the same PostgreSQL schema with no changes
5. **Set up monitoring** — log all export requests for audit trails
6. **Add compression** — export JSON/CSV files can be large; use `compression` middleware

### Security Checklist Before Production

- [ ] API keys are random 32+ character strings (not "demo_abc123")
- [ ] API keys are stored in `.env`, not in the database
- [ ] HTTPS is enforced
- [ ] Rate limiting is active on export endpoints
- [ ] All `DELETE CASCADE` behaviors are documented (operator understands data deletion)
- [ ] Consent status is checked before exporting any data
- [ ] Audit logging records every export request