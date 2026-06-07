# QoE Mobile Network Monitoring App

## Project Overview

This project is the frontend implementation of a QoE (Quality of Experience) Mobile Network Monitoring Application.

The frontend will be developed using:

- React Native
- Expo
- TypeScript
- NativeWind

Current scope is frontend implementation only.

---

# Excluded From Current Phase

The following features are NOT part of the current implementation:

- Backend API integration
- Authentication
- SQLite database
- GPS collection
- Background monitoring
- Push notifications
- Real network measurements
- Data synchronization

All data should be mocked.

---

# Application Flow

## First Launch Experience

### Screen 1: Onboarding

Purpose:

Introduce the application and explain its benefits.

Contents:

- App logo
- Welcome message
- Short explanation of QoE monitoring
- Illustration
- Continue button

Navigation:

Continue → Consent Screen

---

### Screen 2: Consent

Purpose:

Explain data collection and obtain user agreement.

Contents:

- Privacy explanation
- Data collection explanation
- Location sharing toggle
- Notification toggle
- Background monitoring toggle
- Agree and Continue button

Navigation:

Agree and Continue → Main Application

---

# Main Application

Bottom Tab Navigation containing:

1. Home
2. History
3. Test
4. Settings

---

# Screen 3: Home

Purpose:

Display current network information.

Sections:

## Network Status

- Signal Strength
- Network Type
- Mobile Operator

## Performance Metrics

- Download Speed
- Upload Speed
- Latency

## Data Usage

- Today's Data Consumption

## Monitoring Status

- Monitoring Active Indicator

Use mock values.

---

# Screen 4: History

Purpose:

Display historical network performance.

Sections:

## Signal Strength Trend

Line Chart

## Download Speed Trend

Bar Chart

## Historical Records

Each record contains:

- Date
- Time
- Signal Strength
- Download Speed
- Upload Speed
- Latency

Use mock data.

---

# Screen 5: Test

Purpose:

Allow users to perform speed tests.

Frontend simulation only.

Sections:

## Start Test Area

- Start Test Button

## Test Results

- Download Speed
- Upload Speed
- Ping

## Status

- Idle
- Testing
- Complete

Use simulated data.

---

# Screen 6: Settings

Purpose:

Application configuration.

Sections:

## Notifications

- Enable Alerts Toggle

## Upload Settings

- WiFi Only Toggle

## Monitoring

- Alert Threshold Selector

## Privacy

- Privacy Policy

## Data Management

- Delete Data Button

Use local component state only.

---

# Feedback Modal

The application includes a feedback modal.

This is NOT a screen.

This modal appears periodically.

Purpose:

Collect subjective QoE feedback from users.

Contents:

## Overall Satisfaction

1–5 Star Rating

## Speed Satisfaction

1–5 Star Rating

## Optional Comment

Multiline Text Input

## Actions

- Submit
- Later

The modal should appear as a bottom sheet style component.

---

# Styling

Use NativeWind.

Requirements:

- Modern design
- Mobile-first
- Responsive
- Consistent spacing
- Consistent typography
- Reusable components

Avoid React Native StyleSheet where possible.

Use Tailwind utility classes.

---

# Reusable Components

Buttons:

- PrimaryButton
- SecondaryButton

Cards:

- MetricCard
- StatusCard
- ChartCard

Indicators:

- SignalStrengthIndicator
- NetworkStatusBadge

Lists:

- HistoryItem

Settings:

- SettingRow
- SettingToggle

Feedback:

- FeedbackModal
- StarRating

---

# Navigation Structure

App

├── Onboarding

├── Consent

└── Main Tabs

     ├── Home

     ├── History

     ├── Test

     └── Settings

Overlay Components

└── FeedbackModal

---

# Technical Requirements

Framework:

- React Native
- Expo

Language:

- TypeScript

Styling:

- NativeWind

State Management:

- React State

Data Source:

- Mock Data Only