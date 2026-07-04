# SpeeDT — GitHub Copilot Handoff Prompt

## Project Context

SpeeDT is a **QoE (Quality of Experience) Mobile Network Monitoring** app. Two directories:

| Directory | Tech Stack | Purpose |
|-----------|------------|---------|
| `SpeedDT/` | Expo 54, React Native 0.81, TypeScript, NativeWind | Mobile app (frontend) |
| `QoE_Backend/` | Node.js, Express 5, PostgreSQL (Neon), node-cron | API server (backend) |

---

## What's Already Built — Frontend (`SpeedDT/`)

### Screens (all UI complete, all data is MOCK/hardcoded)

| Screen | File | What It Shows | Mock Data Used |
|--------|------|---------------|----------------|
| Onboarding | `screens/onboarding-screen.tsx` | Welcome, feature previews, "Get Started" button | Static text only |
| Consent | `screens/consent-screen.tsx` | Permission list, "I AGREE & CONTINUE" button | Static text only |
| Home | `screens/home-screen.tsx` | Download gauge (142 Mbps), upload (48.2), ping (12ms), network status, reliability (98/100), 3 recent tests | `MOCK` object (lines 6-39) |
| History | `screens/history-screen.tsx` | Avg download (45.2), peak (120), trend chart, 3 recent records | `MOCK` object (lines 6-36) |
| Test | `screens/test-screen.tsx` | GO button, simulated 2.5s test, shows 150.5/45.2/22ms/4ms results | `MOCK_RESULTS` (lines 9-14), `CONNECTION` (lines 16-19) |
| Settings | `screens/settings-screen.tsx` | 3 toggles (data collection, wifi-only, notifications), delete button | Local `useState` only |

### Navigation
- `app/_layout.tsx` — Stack: index (Onboarding) → consent → (tabs)
- `app/(tabs)/_layout.tsx` — Bottom Tabs: Home, History, Test, Settings
- `navigation/routes.ts` — Route constants

### Key UI Components
- NativeWind styling with custom theme colors (brand-navy, brand-teal, brand-card, etc.)
- SVG gauge on HomeScreen, SVG trend chart on HistoryScreen
- Reusable components in `components/` (onboarding, consent, ui)

---

## What's Already Built — Backend (`QoE_Backend/`)

### Architecture (Layered: Routes → Controllers → Services → PostgreSQL)

```
QoE_Backend/
├── server.js                          # Entry: loads .env, inits DB, starts Express
├── src/
│   ├── app.js                         # Express app: CORS, JSON, all routes mounted
│   ├── config/db.js                   # PostgreSQL Pool → Neon cloud DB
│   ├── routes/                        # 6 route files
│   │   ├── device.routes.js           # POST /api/devices, GET /api/devices/:id
│   │   ├── metrics.routes.js          # POST /api/metrics, GET /api/metrics/latest/:id
│   │   ├── location.routes.js         # POST /api/locations, GET /api/locations/history/:id
│   │   ├── feedback.routes.js         # POST /api/feedback
│   │   ├── analytics.routes.js        # GET /api/analytics/average-speed/:id, /average-qoe/:id, /latest-metric/:id
│   │   └── export.routes.js           # GET /api/export/device/:id, /all, /operators (all require Bearer token)
│   ├── controllers/                   # 6 controller files (thin: parse req, call service, send res)
│   ├── services/                      # 7 service files (SQL queries, business logic)
│   │   ├── device.service.js          # registerDevice, getDeviceById
│   │   ├── metrics.service.js         # ingestMetric, getLatestMetricByDevice, getAverageSpeedByDevice
│   │   ├── location.service.js        # trackLocation, getLocationHistory
│   │   ├── feedback.service.js        # submitFeedback
│   │   ├── analytics.service.js       # getAverageQoEByDevice, getLatestMetricByDevice
│   │   ├── export.service.js          # JSON/CSV export with operator filtering, weekly file generation
│   │   └── scheduler.service.js       # node-cron: weekly Monday 2AM auto-export
│   └── middleware/
│       ├── errorHandler.js            # Global error handler
│       ├── validation.js              # UUID validation, required field checks, rating bounds
│       └── operatorAuth.js            # Bearer token → identifies operator (MTN/Orange/Camtel)
├── .env                               # DATABASE_URL + OPERATOR_API_KEYS
├── package.json                       # express, pg, dotenv, cors, nodemon, node-cron
├── test.rest                          # All endpoint test examples
└── exports/                           # Auto-generated weekly export files
```

### Database Schema (4 tables, already created in Neon)

```sql
subscriber_device (anonymous_id UUID PK, device_model, os, app_version, consent_given, data_collection_enabled, wifi_only_uploads, notifications_enabled, created_at)
network_metric    (metric_id BIGSERIAL PK, anonymous_id FK, network_type, operator_name, signal_strength_dbm, download_mbps, upload_mbps, latency_ms, jitter_ms, packet_loss_pct, recorded_at)
location          (location_id BIGSERIAL PK, anonymous_id FK, latitude, longitude, location_name, recorded_at)
feedback          (feedback_id BIGSERIAL PK, anonymous_id FK, metric_id FK nullable, overall_rating, speed_rating, delay_rating, reliability_rating, comment, recorded_at)
```

### Existing API Endpoints (all working)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/devices` | No | Register device → returns `anonymous_id` |
| GET | `/api/devices/:id` | No | Get device info |
| POST | `/api/metrics` | No | Save one network metric |
| GET | `/api/metrics/latest/:id` | No | Get latest metric for device |
| POST | `/api/locations` | No | Save a location point |
| GET | `/api/locations/history/:id` | No | Get all locations for device |
| POST | `/api/feedback` | No | Submit feedback with ratings |
| GET | `/api/analytics/average-speed/:id` | No | AVG download + upload |
| GET | `/api/analytics/average-qoe/:id` | No | AVG of all 4 ratings |
| GET | `/api/analytics/latest-metric/:id` | No | Latest metric (same as metrics/latest) |
| GET | `/api/export/device/:id?format=json\|csv` | Bearer | Export single device (operator-filtered) |
| GET | `/api/export/all?format=json\|csv` | Bearer | Export all devices for operator |
| GET | `/api/export/operators` | Bearer | List configured operators |

### Operator Export Auth
- API keys stored in `.env`: `OPERATOR_API_KEYS='{"MTN Cameroon":"mtn_api_key_demo_abc123","Orange Cameroon":"orange_api_key_demo_def456","Camtel":"camtel_api_key_demo_ghi789"}'`
- All export queries filter by `WHERE operator_name = <identified operator>` — operators never see each other's data
- 3 export methods: per-device JSON, bulk CSV, weekly auto-export to `exports/` folder

---

## What Needs to Be Built — Complete Implementation

### Step 1: Install Expo Hardware Packages

```bash
cd SpeedDT
npx expo install expo-network expo-device expo-location expo-cellular expo-task-manager expo-background-fetch @react-native-async-storage/async-storage
```

### Step 2: Create `SpeedDT/services/device-info.ts`

Read real hardware data from the phone. Functions:

```typescript
export async function getDeviceModel(): Promise<string>
  // expo-device: Device.modelName, Device.deviceName

export async function getOsVersion(): Promise<string>
  // expo-device: Device.osVersion + Device.osName → "iOS 18.2" or "Android 15"

export async function getAppVersion(): Promise<string>
  // expo-constants: Constants.expoConfig?.version || "1.0.0"

export async function getNetworkType(): Promise<string>
  // expo-network: Network.getNetworkStateAsync() → type (CELLULAR, WIFI, etc.)
  // Map to: "5G", "4G LTE", "3G", "Wi-Fi", "Ethernet", "No Service"

export async function getOperatorName(): Promise<string | null>
  // expo-cellular: Cellular.getCarrierNameAsync() → "MTN Cameroon", "Orange Cameroon", etc.

export async function getSignalStrength(): Promise<number | null>
  // expo-cellular: not directly available on iOS
  // Android: try to get via Cellular.getCellularGenerationAsync() or network state
  // Fallback: return null if unavailable

export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null>
  // expo-location: Location.getCurrentPositionAsync({}) → coords
  // Request permissions first with Location.requestForegroundPermissionsAsync()

export async function getIpAddress(): Promise<string | null>
  // expo-network: Network.getIpAddressAsync()
```

### Step 3: Create `SpeedDT/services/storage.ts`

Persist data locally using AsyncStorage:

```typescript
// Keys used:
const KEYS = {
  DEVICE_ID: '@speeddt_device_id',
  PENDING_METRICS: '@speeddt_pending_metrics',
  USER_PREFERENCES: '@speeddt_user_preferences',
};

export async function saveDeviceId(id: string): Promise<void>
export async function getDeviceId(): Promise<string | null>
export async function clearDeviceId(): Promise<void>

export async function savePendingMetrics(metrics: any[]): Promise<void>
export async function getPendingMetrics(): Promise<any[]>
export async function addPendingMetric(metric: any): Promise<void>
export async function clearPendingMetrics(): Promise<void>

export async function saveUserPreferences(prefs: object): Promise<void>
export async function getUserPreferences(): Promise<object | null>
```

### Step 4: Create `SpeedDT/services/api.ts`

Centralized API client. Base URL should be configurable (default `http://localhost:5000`):

```typescript
const BASE_URL = 'http://localhost:5000';

async function request<T>(method: string, path: string, body?: any): Promise<T>

// Device endpoints
export async function registerDevice(deviceInfo: {
  device_model: string; os: string; app_version: string; consent_given: boolean
}): Promise<{ success: boolean; data: { anonymous_id: string } }>
  // POST /api/devices

export async function getDevice(deviceId: string): Promise<Device>
  // GET /api/devices/:deviceId

// Metrics endpoints
export async function submitMetric(metric: {
  anonymous_id: string; network_type: string; operator_name?: string;
  signal_strength_dbm?: number; download_mbps?: number; upload_mbps?: number;
  latency_ms?: number; jitter_ms?: number; packet_loss_pct?: number
}): Promise<any>
  // POST /api/metrics

export async function getLatestMetric(deviceId: string): Promise<NetworkMetric>
  // GET /api/analytics/latest-metric/:deviceId

export async function getAverageSpeed(deviceId: string): Promise<{ average_download_mbps: number; average_upload_mbps: number }>
  // GET /api/analytics/average-speed/:deviceId

// Location endpoints
export async function trackLocation(location: {
  anonymous_id: string; latitude: number; longitude: number; location_name?: string
}): Promise<any>
  // POST /api/locations

// Feedback endpoints
export async function submitFeedback(feedback: {
  anonymous_id: string; metric_id?: number | null;
  overall_rating: number; speed_rating: number; delay_rating: number;
  reliability_rating: number; comment?: string
}): Promise<any>
  // POST /api/feedback

// Analytics endpoints
export async function getAverageQoE(deviceId: string): Promise<{
  average_overall_rating: number; average_speed_rating: number;
  average_delay_rating: number; average_reliability_rating: number
}>
  // GET /api/analytics/average-qoe/:deviceId
```

### Step 5: Create `SpeedDT/services/speed-test.ts`

Real speed test logic (replaces the `setTimeout` mock in TestScreen):

```typescript
export interface SpeedTestResult {
  download_mbps: number;
  upload_mbps: number;
  latency_ms: number;
  jitter_ms: number;
  packet_loss_pct: number;
}

export async function runFullSpeedTest(): Promise<SpeedTestResult>
  // 1. measureLatency() — send 5 HEAD requests to backend, measure RTT, take median
  // 2. measureJitter() — calculate standard deviation of the 5 latency measurements
  // 3. measureDownloadSpeed() — fetch a file from backend, measure time, calculate Mbps
  // 4. measureUploadSpeed() — POST dummy data to backend, measure time, calculate Mbps
  // 5. Return combined result

async function measureLatency(): Promise<number>
  // Send 5 HEAD requests to http://localhost:5000/api/test-files/ping
  // Measure round-trip time for each, return median

async function measureJitter(latencies: number[]): Promise<number>
  // Calculate standard deviation of the latency array

async function measureDownloadSpeed(): Promise<number>
  // Fetch http://localhost:5000/api/test-files/download.bin
  // Record start time, download, record end time
  // Mbps = (fileSizeBytes * 8) / (endTime - startTime) / 1_000_000

async function measureUploadSpeed(): Promise<number>
  // Generate 1MB of dummy data (new ArrayBuffer(1_000_000))
  // POST to http://localhost:5000/api/test-files/upload
  // Record start time, upload, record end time
  // Mbps = (dataSizeBytes * 8) / (endTime - startTime) / 1_000_000
```

### Step 6: Create `SpeedDT/services/background-collection.ts`

Passive monitoring every 5 minutes, batch upload every hour:

```typescript
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const BACKGROUND_COLLECTION_TASK = 'speeddt-background-collection';

TaskManager.defineTask(BACKGROUND_COLLECTION_TASK, async () => {
  // 1. Read current network info (type, operator, signal strength)
  // 2. Read current location
  // 3. Create a metric object with download_mbps = null (passive snapshot)
  // 4. Save to pending metrics queue via storage.ts
  // 5. Check if 1 hour has passed since last upload
  // 6. If yes: flush queue via POST /api/metrics (one by one or batch)
  // 7. Clear pending metrics
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

export async function registerBackgroundCollection(): Promise<void>
  // Register the task with BackgroundFetch
  // Set minimum interval to 5 minutes (300 seconds)

export async function unregisterBackgroundCollection(): Promise<void>
  // Unregister the task
```

### Step 7: Add Missing Backend Endpoints

The backend needs these additional endpoints that the frontend will call:

**A) `GET /api/metrics/history/:deviceId?page=1&limit=20`** — Paginated history list

In `metrics.routes.js` add:
```javascript
router.get("/history/:deviceId", validateDeviceIdParam, getMetricHistory);
```

In `metrics.controller.js` add:
```javascript
const getMetricHistory = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const result = await metricsService.getMetricHistory(deviceId, limit, offset);
    res.json({ success: true, data: result.rows, total: result.total });
  } catch (err) { next(err); }
};
```

In `metrics.service.js` add:
```javascript
const getMetricHistory = async (anonymous_id, limit, offset) => {
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM network_metric WHERE anonymous_id = $1 AND download_mbps IS NOT NULL`,
    [anonymous_id]
  );
  const dataResult = await pool.query(
    `SELECT * FROM network_metric WHERE anonymous_id = $1 AND download_mbps IS NOT NULL ORDER BY recorded_at DESC LIMIT $2 OFFSET $3`,
    [anonymous_id, limit, offset]
  );
  return { rows: dataResult.rows, total: parseInt(countResult.rows[0].count) };
};
```

**B) `GET /api/analytics/trend/:deviceId?days=7`** — Daily averages for trend chart

In `analytics.routes.js` add:
```javascript
router.get("/trend/:deviceId", validateDeviceIdParam, getTrendPerDevice);
```

In `analytics.controller.js` add:
```javascript
const getTrendPerDevice = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const trend = await analyticsService.getTrendByDevice(req.params.deviceId, days);
    res.json({ success: true, data: trend });
  } catch (err) { next(err); }
};
```

In `analytics.service.js` add:
```javascript
const getTrendByDevice = async (anonymous_id, days) => {
  const result = await pool.query(
    `SELECT (recorded_at::date) AS day,
            ROUND(AVG(download_mbps)::numeric, 1) AS avg_download,
            ROUND(AVG(signal_strength_dbm)::numeric, 1) AS avg_signal
     FROM network_metric
     WHERE anonymous_id = $1 AND recorded_at >= NOW() - ($2 || ' days')::INTERVAL
     GROUP BY (recorded_at::date) ORDER BY day ASC`,
    [anonymous_id, days]
  );
  return result.rows;
};
```

**C) `PUT /api/devices/:deviceId/preferences`** — Update settings toggles

In `device.routes.js` add:
```javascript
router.put("/:deviceId/preferences", validateDeviceIdParam, updateDevicePreferences);
```

In `device.controller.js` add:
```javascript
const updateDevicePreferences = async (req, res, next) => {
  try {
    const device = await deviceService.updateDevicePreferences(req.params.deviceId, req.body);
    if (!device) { const e = new Error("Device not found"); e.status = 404; throw e; }
    res.json({ success: true, data: device });
  } catch (err) { next(err); }
};
```

In `device.service.js` add:
```javascript
const updateDevicePreferences = async (anonymous_id, { data_collection_enabled, wifi_only_uploads, notifications_enabled }) => {
  const result = await pool.query(
    `UPDATE subscriber_device SET
      data_collection_enabled = COALESCE($2, data_collection_enabled),
      wifi_only_uploads = COALESCE($3, wifi_only_uploads),
      notifications_enabled = COALESCE($4, notifications_enabled)
     WHERE anonymous_id = $1 RETURNING *`,
    [anonymous_id, data_collection_enabled, wifi_only_uploads, notifications_enabled]
  );
  return result.rows[0];
};
```

**D) `DELETE /api/devices/:deviceId/data`** — Delete all data for a device

In `device.routes.js` add:
```javascript
router.delete("/:deviceId/data", validateDeviceIdParam, deleteDeviceData);
```

In `device.controller.js` add:
```javascript
const deleteDeviceData = async (req, res, next) => {
  try {
    await deviceService.deleteDeviceData(req.params.deviceId);
    res.json({ success: true, message: "All device data deleted" });
  } catch (err) { next(err); }
};
```

In `device.service.js` add:
```javascript
const deleteDeviceData = async (anonymous_id) => {
  await pool.query("DELETE FROM feedback WHERE anonymous_id = $1", [anonymous_id]);
  await pool.query("DELETE FROM location WHERE anonymous_id = $1", [anonymous_id]);
  await pool.query("DELETE FROM network_metric WHERE anonymous_id = $1", [anonymous_id]);
  // Keep the device record but reset consent
  await pool.query("UPDATE subscriber_device SET consent_given = false WHERE anonymous_id = $1", [anonymous_id]);
};
```

**E) Test files for speed measurement** — New route file

Create `QoE_Backend/src/routes/test-files.routes.js`:
```javascript
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Serve a small file for download speed test (5MB)
router.get("/download.bin", (req, res) => {
  const filePath = path.join(__dirname, "../../public/test-file-5mb.bin");
  res.sendFile(filePath);
});

// Accept uploaded data for upload speed test
router.post("/upload", (req, res) => {
  let size = 0;
  req.on("data", (chunk) => { size += chunk.length; });
  req.on("end", () => {
    res.json({ success: true, size_bytes: size });
  });
});

// Simple ping endpoint for latency measurement
router.get("/ping", (req, res) => {
  res.json({ success: true, timestamp: Date.now() });
});

module.exports = router;
```

Create `QoE_Backend/public/test-file-5mb.bin` — a 5MB file of zeros:
```bash
# In terminal:
dd if=/dev/zero of=QoE_Backend/public/test-file-5mb.bin bs=1M count=5
# On Windows:
fsutil file createnew QoE_Backend/public/test-file-5mb.bin 5242880
```

In `QoE_Backend/src/app.js` add:
```javascript
const testFilesRoutes = require("./routes/test-files.routes");
app.use("/api/test-files", testFilesRoutes);
```

### Step 8: Connect Each Screen to Real Data

**ConsentScreen (`screens/consent-screen.tsx`):**
- Import `api.ts`, `device-info.ts`, `storage.ts`
- On "I AGREE & CONTINUE" press:
  1. Call `getDeviceModel()`, `getOsVersion()`, `getAppVersion()`
  2. Call `registerDevice({ device_model, os, app_version, consent_given: true })`
  3. Save returned `anonymous_id` via `saveDeviceId(id)`
  4. Navigate to tabs

**HomeScreen (`screens/home-screen.tsx`):**
- Import `api.ts`, `storage.ts`
- On mount:
  1. `const deviceId = await getDeviceId()`
  2. `const latest = await getLatestMetric(deviceId)` → populate download, upload, ping, signal
  3. `const avg = await getAverageSpeed(deviceId)` → populate reliability score
  4. For recent tests: call history endpoint with limit=3
- Replace all `MOCK.*` references with state variables populated from API
- FAB button → navigate to Test tab

**TestScreen (`screens/test-screen.tsx`):**
- Import `speed-test.ts`, `api.ts`, `device-info.ts`, `storage.ts`
- On mount: call `getNetworkType()`, `getOperatorName()` → populate connection info
- On "GO" press:
  1. Call `runFullSpeedTest()` → get real results
  2. Call `getNetworkType()`, `getOperatorName()`, `getSignalStrength()`
  3. Call `submitMetric({ anonymous_id, network_type, operator_name, signal_strength_dbm, download_mbps, upload_mbps, latency_ms, jitter_ms })`
  4. Display results
- Remove `MOCK_RESULTS`, `CONNECTION`, `TEST_DURATION_MS`, the `setTimeout` mock

**HistoryScreen (`screens/history-screen.tsx`):**
- Import `api.ts`, `storage.ts`
- On mount:
  1. `const avg = await getAverageSpeed(deviceId)` → avg download + peak
  2. `const trend = await getTrend(deviceId, 7)` → populate trend chart
  3. `const history = await getHistory(deviceId, 1, 20)` → populate records list
- "VIEW ALL" → load next page
- Replace all `MOCK.*` references

**SettingsScreen (`screens/settings-screen.tsx`):**
- Import `api.ts`, `storage.ts`
- On mount: `const device = await getDevice(deviceId)` → load toggle states
- On toggle change: `await updatePreferences(deviceId, { data_collection_enabled, wifi_only_uploads, notifications_enabled })`
- "Delete All My Data" → call delete endpoint + clear AsyncStorage

**`app/_layout.tsx`:**
- On app launch: check `getDeviceId()` from AsyncStorage
- If device ID exists → skip onboarding, go directly to tabs
- If no device ID → show onboarding flow

### Step 9: Update `test.rest` with New Endpoints

Add these test examples to `QoE_Backend/test.rest`:

```rest
### Get metric history (paginated)
GET http://localhost:5000/api/metrics/history/1d629c65-4f30-4680-b983-34afeaf40d64?page=1&limit=5

### Get trend data (7 days)
GET http://localhost:5000/api/analytics/trend/1d629c65-4f30-4680-b983-34afeaf40d64?days=7

### Update device preferences
PUT http://localhost:5000/api/devices/1d629c65-4f30-4680-b983-34afeaf40d64/preferences
Content-Type: application/json
{ "data_collection_enabled": true, "wifi_only_uploads": false, "notifications_enabled": true }

### Delete all device data
DELETE http://localhost:5000/api/devices/1d629c65-4f30-4680-b983-34afeaf40d64/data

### Ping test (for latency measurement)
GET http://localhost:5000/api/test-files/ping

### Download test file (for download speed measurement)
GET http://localhost:5000/api/test-files/download.bin

### Upload test (for upload speed measurement)
POST http://localhost:5000/api/test-files/upload
Content-Type: application/octet-stream

< binary data here >
```

---

## Implementation Order (Recommended)

| # | Task | Files to Create/Modify | Est. Time |
|---|------|----------------------|-----------|
| 1 | Install Expo packages | Run `npx expo install ...` | 5 min |
| 2 | Create `services/device-info.ts` | NEW | 1 hr |
| 3 | Create `services/storage.ts` | NEW | 30 min |
| 4 | Create `services/api.ts` | NEW | 1.5 hr |
| 5 | Create `services/speed-test.ts` | NEW | 2 hr |
| 6 | Add backend: history endpoint | `metrics.routes.js`, `metrics.controller.js`, `metrics.service.js` | 30 min |
| 7 | Add backend: trend endpoint | `analytics.routes.js`, `analytics.controller.js`, `analytics.service.js` | 30 min |
| 8 | Add backend: preferences + delete | `device.routes.js`, `device.controller.js`, `device.service.js` | 30 min |
| 9 | Add backend: test files route | NEW `test-files.routes.js`, `public/test-file-5mb.bin`, modify `app.js` | 30 min |
| 10 | Connect ConsentScreen | `screens/consent-screen.tsx` | 30 min |
| 11 | Connect HomeScreen | `screens/home-screen.tsx` | 1 hr |
| 12 | Connect TestScreen | `screens/test-screen.tsx` | 1.5 hr |
| 13 | Connect HistoryScreen | `screens/history-screen.tsx` | 1 hr |
| 14 | Connect SettingsScreen | `screens/settings-screen.tsx` | 30 min |
| 15 | Update app _layout for re-launch | `app/_layout.tsx` | 15 min |
| 16 | Create background collection | `services/background-collection.ts` | 1.5 hr |
| 17 | Update test.rest | `test.rest` | 15 min |
| 18 | End-to-end testing | Run app + backend, verify all flows | 2 hr |

---

## Key Architecture Decisions

1. **Device ID Flow:** ConsentScreen registers device → gets `anonymous_id` → stored in AsyncStorage → all screens read from AsyncStorage → all API calls include this ID
2. **Offline Queue:** If backend is unreachable, metrics are queued locally via `storage.ts` and sent when connection restores
3. **Speed Test Server:** Backend serves a 5MB static file for download tests. For production, use a CDN or dedicated speed test server
4. **Operator Detection:** Use `expo-cellular` to get carrier name. Map Cameroon MCC 624 to operator names
5. **Background Collection:** Uses `expo-background-fetch` (iOS) and `expo-task-manager` (Android). Background execution is limited on modern iOS — the 5-minute interval may be approximate
6. **Port:** Backend runs on port 5000 (from `.env` or default). The `test.rest` has some endpoints on 5050 — standardize to 5000

---

## TypeScript Interfaces (match backend responses)

```typescript
interface Device {
  anonymous_id: string;
  device_model: string;
  os: string;
  app_version: string;
  consent_given: boolean;
  data_collection_enabled: boolean;
  wifi_only_uploads: boolean;
  notifications_enabled: boolean;
  created_at: string;
}

interface NetworkMetric {
  metric_id: number;
  anonymous_id: string;
  network_type: string;
  operator_name: string | null;
  signal_strength_dbm: number | null;
  download_mbps: number | null;
  upload_mbps: number | null;
  latency_ms: number | null;
  jitter_ms: number | null;
  packet_loss_pct: number | null;
  recorded_at: string;
}

interface Location {
  location_id: number;
  anonymous_id: string;
  latitude: number;
  longitude: number;
  location_name: string | null;
  recorded_at: string;
}

interface Feedback {
  feedback_id: number;
  anonymous_id: string;
  metric_id: number | null;
  overall_rating: number;
  speed_rating: number;
  delay_rating: number;
  reliability_rating: number;
  comment: string | null;
  recorded_at: string;
}
```

---

## Testing Checklist

- [ ] App launches → Onboarding screen appears (first time)
- [ ] Onboarding → Consent → "I AGREE" → registers device → navigates to Home
- [ ] HomeScreen shows real network data (not mock)
- [ ] HomeScreen shows recent tests from backend
- [ ] TestScreen "GO" button runs real speed test
- [ ] Test results appear and are saved to backend
- [ ] HistoryScreen shows real records from backend
- [ ] HistoryScreen trend chart shows 7-day data
- [ ] SettingsScreen toggles persist across app restarts
- [ ] Background collection runs every 5 minutes
- [ ] Hourly batch upload sends queued metrics
- [ ] Offline mode: metrics queue locally, upload when online
- [ ] Re-launch app → skips onboarding, goes directly to Home
- [ ] Operator export: MTN key returns only MTN data
- [ ] Operator export: Orange key cannot see MTN data
- [ ] Weekly export files are generated in `exports/` directory