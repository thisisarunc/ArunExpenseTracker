# Money Plus - Blank White Screen Fix Guide

## Issues Identified and Fixed

### 1. **Missing Error Boundary**
- **Problem**: Any runtime error would crash the app to a white screen with no error message
- **Fix**: Added an ErrorBoundary component that catches errors and displays a user-friendly error screen

### 2. **Unsafe Module Imports**
- **Problem**: SMS parser and native modules could fail to import and crash the app
- **Fix**: Wrapped all imports in try-catch blocks with fallback functions

### 3. **Missing Splash Screen Configuration**
- **Problem**: app.json had splash config but no image property
- **Fix**: Updated app.json to use the icon.png as splash screen image

### 4. **No Loading State Error Handling**
- **Problem**: If AsyncStorage failed, the app would hang
- **Fix**: Added proper error handling with Alert messages and fallbacks

## Files to Replace

### 1. Replace App.js
```bash
# Backup original
cp App.js App_backup.js

# Use fixed version
cp App_Fixed.js App.js
```

### 2. Update app.json (Optional but Recommended)
```bash
# Backup original
cp app.json app_backup.json

# Use fixed version
cp app_fixed.json app.json
```

## Testing Steps

### Local Testing with Expo Go:
```bash
# Clear cache and restart
expo start -c

# Or
npx expo start --clear
```

### Building for Android:
```bash
# Clear EAS build cache
eas build --platform android --clear-cache

# Or just rebuild
eas build --platform android
```

## Common Causes of Blank White Screen

### 1. **JavaScript Errors**
- Syntax errors in code
- Runtime errors in component lifecycle
- Missing or incorrect imports
- **Solution**: Error boundary now catches these

### 2. **Module Import Failures**
- Native modules not linking properly
- Incompatible module versions
- **Solution**: All imports now have fallbacks

### 3. **AsyncStorage Issues**
- Permission problems
- Storage quota exceeded
- Corrupted data
- **Solution**: Added error handling with alerts

### 4. **Build Configuration Issues**
- Missing splash screen assets
- Incorrect app.json settings
- **Solution**: Updated app.json with proper config

### 5. **Platform-Specific Issues**
- Android minSdkVersion too high/low
- Missing Android permissions
- **Solution**: Set minSdkVersion to 21, all permissions declared

## Debugging Tips

### 1. Check Logs in Expo Dev Tools
```bash
expo start
# Then press 'j' to open debugger
```

### 2. View Android Logcat
```bash
adb logcat | grep -i "reactnative\|expo\|error"
```

### 3. Enable Remote Debugging
- Shake device
- Select "Debug"
- Open Chrome DevTools

### 4. Check Metro Bundler Output
Look for:
- Bundle building errors
- Module resolution failures
- Syntax errors

## Key Fixes in App_Fixed.js

### 1. Error Boundary Component
```javascript
class ErrorBoundary extends React.Component {
  // Catches all React errors
  // Shows friendly error screen
  // Allows retry
}
```

### 2. Safe Module Imports
```javascript
// Safe SMS parser import
let parseSMS = null;
try {
  parseSMS = require('./smsParser').parseSMS;
} catch (e) {
  parseSMS = (text) => null; // Fallback
}
```

### 3. AsyncStorage Error Handling
```javascript
const loadData = async () => {
  try {
    const data = await AsyncStorage.getItem('moneyplus-data-v2');
    // ... load data
  } catch (e) {
    Alert.alert('Error', 'Failed to load data. Using defaults.');
  } finally {
    setLoading(false); // Always set loading to false
  }
};
```

### 4. Platform Checks
```javascript
// Only enable SMS features on Android with module available
if (Platform.OS === 'android' && SmsAndroid) {
  // SMS functionality
} else {
  Alert.alert('Not Available', 'SMS reading not supported');
}
```

## After Applying Fixes

### 1. Clear All Caches
```bash
# Clear npm cache
npm cache clean --force

# Clear Expo cache
expo start -c

# Clear Android build cache
cd android && ./gradlew clean && cd ..
```

### 2. Reinstall Dependencies
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### 3. Rebuild the App
```bash
eas build --platform android --clear-cache
```

## If Still Having Issues

### 1. Check Device Compatibility
- Android version 5.0+ (API 21+)
- Sufficient storage space
- Not running in restricted mode

### 2. Try Development Build First
```bash
expo start --dev-client
```

### 3. Enable Verbose Logging
```bash
expo start --verbose
```

### 4. Test on Different Device
- Try on emulator
- Try on different physical device
- Check if issue is device-specific

## Production Checklist

Before building for production:

- ✅ Error boundary implemented
- ✅ All imports have error handling
- ✅ AsyncStorage has try-catch
- ✅ Loading states properly handled
- ✅ Platform-specific code checked
- ✅ Splash screen configured
- ✅ App icon present
- ✅ All permissions declared
- ✅ Tested on multiple devices
- ✅ No console errors in development

## Additional Recommendations

### 1. Add Crash Reporting
Consider adding Sentry or similar:
```bash
npm install @sentry/react-native
```

### 2. Add Analytics
Track app opens to detect blank screen issues:
```bash
npm install expo-analytics
```

### 3. Implement Proper Logging
```javascript
import * as FileSystem from 'expo-file-system';

const logError = async (error) => {
  const log = `${new Date().toISOString()}: ${error}\n`;
  await FileSystem.appendAsStringAsync(
    FileSystem.documentDirectory + 'error.log',
    log
  );
};
```

## Support

If you still face issues:
1. Check the error boundary message
2. Review device logs (adb logcat)
3. Test in Expo Go first
4. Check Expo forums for similar issues
5. Verify all dependencies are compatible

## Version Compatibility

This fix is tested with:
- Expo SDK 50
- React Native 0.73.6
- React 18.2.0
- Android API 21+
- iOS 13+
