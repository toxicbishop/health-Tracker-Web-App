# Health Tracker WebApp

A Full-stack wellness tracking application featuring a Flutter Web interactive dashboard and a Node/Express backend that securely saves structured health data directly to Google Sheets and MongoDB.

---

## Project Structure

The project is organized as a monorepo containing the following components:

- **server**: A Node/Express and TypeScript backend that exposes REST endpoints for authentication and health tracking data, persisting users to MongoDB and logs to Google Sheets.
- **flutter_client**: A Dart + Flutter Web client for a phone-first health tracking user interface that adapts dynamically to larger displays.
- **docs**: PDF documents detailing the API layer design and the project requirements.

---

## Getting Started

### Prerequisites

- Node.js (v22 or higher)
- Flutter SDK (stable channel)
- MongoDB instance (for backend user authentication)
- Google Cloud Service Account and Google Sheet (for health log persistence)

### Installation

Install dependencies for all workspace components using the root script:

```bash
npm run install:all
```

### Running Locally

Start the backend server and Flutter web client concurrently:

```bash
npm run dev
```

The server will run on `http://localhost:3000` and the Flutter web client will open in Chrome.

### Building for Production

Compile both the server and the Flutter client for production release:

```bash
npm run build
```

The server distribution will be compiled using `tsc`, and the Flutter web client will be built inside `flutter_client/build/web`.

### Running Tests

Execute the test suites for both the server and client components:

```bash
npm run test
```

---

## Project Architecture

### Backend API (Server)
- **Framework**: Express with TypeScript.
- **Validation**: Zod payload interceptors.
- **Authentication**: JWT and Bcryptjs.
- **Persistence**: Google Sheets for clinical vitals/logs and MongoDB for user accounts.
- **Security**: Rate limiters for auth and API routes.

### Frontend Client (Flutter Client)
- **Framework**: Flutter Web.
- **Layout**: Adaptive navigation layout that switches between bottom navigation on compact screens and side navigation rails on desktop.
- **Features**: User authentication, health logs submission (Weight, Blood Pressure, Heart Rate), and list views of logged history.

---

## Architecture Diagram

![Backend Architecture](./backend_architecture.svg)
