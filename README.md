# 💰 Money+ Expense Tracker

A beautiful, cute expense tracker app for iOS and Android built with React Native & Expo.

## ✨ Features

- 📊 **Donut Charts** - Visualize expenses by category and payment mode
- 💳 **Payment Modes** - Track Cash, Credit Card, Debit Card, UPI, Net Banking
- 📁 **Custom Categories** - Create your own categories with 50+ cute icons
- 💰 **INR Currency** - All amounts in Indian Rupees (₹)
- 🎯 **Budget Tracking** - Set monthly budget and track progress
- 🔍 **Search** - Find transactions quickly
- 💾 **Local Storage** - All data saved securely on device

---

## 🚀 Quick Start

### Prerequisites

1. **Install Node.js** (v18 or later)
   - Download from: https://nodejs.org/

2. **Install Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

3. **Install EAS CLI** (for building)
   ```bash
   npm install -g eas-cli
   ```

4. **Create Expo Account**
   - Sign up at: https://expo.dev/signup

---

## 📱 Development Setup

### Step 1: Install Dependencies

```bash
cd money-plus-app
npm install
```

### Step 2: Start Development Server

```bash
npm start
# or
expo start
```

### Step 3: Test on Your Phone

1. **Download Expo Go** app on your phone:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Scan the QR code** shown in terminal with:
   - iOS: Camera app
   - Android: Expo Go app

---

## 🏗️ Building for Production

### Step 1: Login to Expo

```bash
eas login
```

### Step 2: Configure Build

```bash
eas build:configure
```

### Step 3: Create App Icons

Create these image files in the `assets` folder:
- `icon.png` - 1024x1024px (app icon)
- `splash.png` - 1284x2778px (splash screen)
- `adaptive-icon.png` - 1024x1024px (Android adaptive icon)
- `favicon.png` - 48x48px (web favicon)

### Step 4: Update App Configuration

Edit `app.json` and update:
```json
{
  "expo": {
    "name": "Your App Name",
    "ios": {
      "bundleIdentifier": "com.yourname.moneyplusexpensetracker"
    },
    "android": {
      "package": "com.yourname.moneyplusexpensetracker"
    }
  }
}
```

---

## 📲 Build for Android

### Development Build (APK)

```bash
eas build --platform android --profile preview
```

### Production Build (AAB for Play Store)

```bash
eas build --platform android --profile production
```

After build completes, download the `.aab` file from Expo dashboard.

---

## 🍎 Build for iOS

### Requirements
- Apple Developer Account ($99/year): https://developer.apple.com/programs/

### Development Build

```bash
eas build --platform ios --profile development
```

### Production Build (for App Store)

```bash
eas build --platform ios --profile production
```

---

## 🚀 Publishing to App Stores

### Google Play Store

1. **Create Developer Account** ($25 one-time)
   - https://play.google.com/console/signup

2. **Create New App** in Play Console

3. **Upload AAB File**
   - Go to Production > Releases > Create new release
   - Upload the `.aab` file from Expo build

4. **Fill App Details**
   - App name, description, screenshots
   - Content rating questionnaire
   - Privacy policy URL

5. **Submit for Review**

### Apple App Store

1. **Create Developer Account** ($99/year)
   - https://developer.apple.com/programs/

2. **Create App in App Store Connect**
   - https://appstoreconnect.apple.com

3. **Submit Build**
   ```bash
   eas submit --platform ios
   ```

4. **Fill App Details**
   - App name, description, screenshots
   - Age rating
   - Privacy policy URL

5. **Submit for Review**

---

## 📁 Project Structure

```
money-plus-app/
├── App.js              # Main application code
├── app.json            # Expo configuration
├── package.json        # Dependencies
├── babel.config.js     # Babel configuration
├── assets/             # Images and icons
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── README.md           # This file
```

---

## 🎨 Customization

### Change App Colors

Edit the color values in `App.js`:
```javascript
// Primary color (pink)
'#FF9BB3'

// Income color (green)
'#4CAF50'

// Expense color (red)
'#FF6B8A'

// Background
'#FFF9FC'
```

### Add New Categories

Add to the `defaultCategories` array in `App.js`:
```javascript
{ id: 'newcat', name: 'New Category', icon: 'emoji_key', type: 'expense' }
```

### Add New Icons

Add to the `iconLibrary` object in `App.js`:
```javascript
newiconkey: { emoji: '🆕', bg: '#F0F0F0' }
```

---

## 🐛 Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
expo start -c
eas build --clear-cache
```

### Module Not Found

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### iOS Build Issues

Make sure your Apple Developer account is active and bundle identifier is unique.

---

## 📄 License

MIT License - Feel free to use and modify!

---

## 🙏 Support

If you find this helpful, please ⭐ star the repo!

For issues or feature requests, create a GitHub issue.

---

Made with ❤️ using React Native & Expo
