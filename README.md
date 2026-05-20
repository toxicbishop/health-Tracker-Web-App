# Health Tracker

A Flutter Web health tracking application that stores data directly in Google Sheets via a Google Apps Script web app. No dedicated backend server is required.

---

## Project Structure

```
health-Tracker-Web-App/
├── flutter_client/       # Flutter Web client application
├── apps_script.js        # Google Apps Script to deploy on your Google Sheet
└── docs/                 # Project documentation
```

---

## How It Works

The Flutter client communicates directly with a Google Apps Script web app that you deploy on your own Google Sheet. Each user's data is stored in a dedicated tab named after their chosen display name, so there is no shared backend or authentication server.

```
Flutter Web Client  -->  Google Apps Script  -->  Google Sheets (per-user tabs)
```

---

## Getting Started

### Prerequisites

- Flutter SDK (stable channel)
- A Google account with access to Google Sheets and Google Apps Script

### Setting Up the Google Sheet

1. Create a new Google Sheet.
2. Open **Extensions > Apps Script**.
3. Paste the contents of `apps_script.js` into the editor and save.
4. Click **Deploy > New deployment**, choose type **Web app**.
5. Set **Execute as** to yourself and **Who has access** to **Anyone**.
6. Copy the generated web app URL.

### Running the Flutter Client

Install dependencies:

```bash
cd flutter_client
flutter pub get
```

Run in Chrome:

```bash
flutter run -d chrome
```

On first launch, enter your display name and the Apps Script URL copied above to connect.

### Building for Production

```bash
cd flutter_client
flutter build web --no-web-resources-cdn
```

The built files will be in `flutter_client/build/web` and can be hosted on any static file host (GitHub Pages, Firebase Hosting, Netlify, etc.).

### Running Tests

```bash
cd flutter_client
flutter analyze
flutter test
```

---

## Features

- Log Weight, Blood Pressure, Heart Rate, or all at once
- Dashboard with latest readings at a glance
- Full history view with pull-to-refresh
- Interactive line charts with touch tooltips on the Stats screen
- Dark mode toggle in the Profile screen
- CSV export of all logged data
- Per-user data isolation via dedicated Google Sheets tabs
- Persistent session using local storage (no repeated setup)

---

## Architecture

### Flutter Client

- Adaptive navigation layout (bottom bar on mobile, side rail on desktop)
- Direct HTTP communication with the Apps Script web app using `text/plain` content type to avoid CORS preflight requests
- Platform-conditional CSV export via conditional imports (`dart:html` on web, stub on other platforms)
- Theme managed at the app root via a stateful widget exposing a toggle to descendants

### Google Apps Script

- `doPost(e)` accepts JSON payloads and appends rows to the user's tab
- `doGet(e)` returns all rows for the requesting user as JSON
- `getOrCreateSheet(userId)` automatically creates and initializes a tab if one does not exist for the user
