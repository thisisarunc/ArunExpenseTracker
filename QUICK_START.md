# 🚀 Quick Start Guide

## Get Your App Running in 5 Minutes!

### Step 1: Install Required Tools

Open Terminal (Mac) or Command Prompt (Windows) and run:

```bash
# Install Node.js first from https://nodejs.org/

# Then install Expo CLI
npm install -g expo-cli eas-cli
```

### Step 2: Setup Project

```bash
# Navigate to project folder
cd money-plus-app

# Install dependencies
npm install
```

### Step 3: Test on Your Phone

```bash
# Start the app
npm start
```

1. Download **Expo Go** app on your phone
2. Scan the QR code with your phone camera
3. App opens on your phone! 🎉

---

## 📲 Build APK for Android

### Get an APK file you can share:

```bash
# Login to Expo (create free account at expo.dev)
eas login

# Build APK
eas build --platform android --profile preview
```

Wait 10-15 minutes. Download APK from the link provided.

---

## 🍎 Build for iPhone

### Requirements:
- Mac computer
- Apple Developer Account ($99/year)

```bash
eas build --platform ios --profile production
```

---

## 📱 Publish to Stores

### Google Play Store:
1. Create account at https://play.google.com/console ($25)
2. Build production version: `eas build --platform android`
3. Upload the .aab file to Play Console
4. Fill in app details and submit

### Apple App Store:
1. Create account at https://developer.apple.com ($99/year)
2. Build: `eas build --platform ios`
3. Submit: `eas submit --platform ios`
4. Complete listing in App Store Connect

---

## ❓ Need Help?

- Expo Docs: https://docs.expo.dev
- React Native Docs: https://reactnative.dev/docs/getting-started

---

That's it! Your expense tracker app is ready! 🎉
