# 📱 Android — Native Mobile Application

> Native Android app built with Kotlin for the AgriHub agriculture platform.

---

## Overview

The Android module is the native mobile application for AgriHub, built with Kotlin and following modern Android development practices. It provides offline-first capabilities, push notifications, and optimized performance for rural network conditions.

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Kotlin | Programming language |
| Gradle (Kotlin DSL) | Build system |
| Android SDK | Platform APIs |
| Material Design | UI components |
| Retrofit | HTTP client |
| Room | Local database |
| Coroutines | Async programming |

---

## Project Structure

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/          # Kotlin source code
│   │   │   ├── res/           # Resources (layouts, strings, drawables)
│   │   │   └── AndroidManifest.xml
│   │   └── test/              # Unit tests
│   ├── build.gradle.kts       # App-level build config
│   └── proguard-rules.pro     # Code obfuscation rules
├── build.gradle.kts           # Project-level build config
├── settings.gradle.kts        # Settings
├── gradle.properties          # Gradle properties
├── gradlew                    # Gradle wrapper (Unix)
└── gradlew.bat                # Gradle wrapper (Windows)
```

---

## Build & Run

```bash
# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Run unit tests
./gradlew test

# Install on connected device
./gradlew installDebug
```

---

## Key Features

### Offline-First
- Local database caching for all critical data
- Queue-based sync for actions taken offline
- Automatic retry when connectivity restores
- Conflict resolution for concurrent edits

### Push Notifications
- Price alerts and market updates
- Order status changes
- Weather advisories
- Community mentions and replies
- Scheme deadline reminders

### Performance Optimization
- Image compression for slow networks
- Lazy loading and pagination
- Background data sync
- Minimal APK size for low-storage devices

### Accessibility
- Multi-language support (English, Hindi, Telugu)
- Large text mode for readability
- Voice input for search and data entry
- High contrast themes

---

## Minimum Requirements

| Requirement | Value |
|-------------|-------|
| Android Version | 7.0+ (API 24) |
| RAM | 2GB minimum |
| Storage | 50MB app + data |
| Network | 2G/3G/4G/WiFi |

---

## Configuration

The app connects to the AgriHub backend API. Configure the base URL in build variants:

- **Debug**: Points to local/staging server
- **Release**: Points to production API

---

## Testing

```bash
# Unit tests
./gradlew testDebugUnitTest

# Instrumented tests
./gradlew connectedAndroidTest

# Lint checks
./gradlew lint
```
