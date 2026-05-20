# VITAL Flutter Client

Flutter Web client for the health tracker app.

## Run Locally

```bash
flutter pub get
flutter run -d chrome
```

By default the app talks to `http://localhost:3000`. To use another backend:

```bash
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000
```

## Build

```bash
flutter build web --no-web-resources-cdn --no-wasm-dry-run
```

The production web output is written to `build/web`.

## Checks

```bash
flutter analyze
flutter test
```
