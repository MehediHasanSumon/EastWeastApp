# Push Notifications Setup for Development Build

## Why Development Build?
Expo Go doesn't support push notifications. You need a development build to get real push notifications in the device notification panel.

## Step 1: Install Required Packages

```bash
# Navigate to your project directory
cd my-expo-app

# Install push notification packages
npx expo install expo-notifications expo-device

# Install additional dependencies if needed
npx expo install expo-constants
```

## Step 2: Update notificationService.ts

Replace the current `utils/notificationService.ts` with this version:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  sound?: boolean;
  badge?: number;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized = false;

  async initialize() {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('❌ Notification permission denied');
          return false;
        }
        
        // Get push token
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: 'your-project-id', // Replace with your Expo project ID
        });
        
        this.expoPushToken = token.data;
        console.log('🔔 Push Token:', this.expoPushToken);
        
        // Configure notification channels for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('chat', {
            name: 'Chat Messages',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default',
          });
        }
        
        this.isInitialized = true;
        console.log('✅ Notification Service: Initialized successfully');
        return true;
      } else {
        console.log('❌ Must use physical device for push notifications');
        return false;
      }
    } catch (error) {
      console.error('❌ Notification Service: Initialization failed', error);
      return false;
    }
  }

  async scheduleLocalNotification(notification: NotificationData) {
    try {
      if (!this.isInitialized) {
        console.log('⚠️ Notification service not initialized');
        return false;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: notification.sound ? 'default' : undefined,
          badge: notification.badge,
        },
        trigger: null, // Send immediately
      });

      console.log('🔔 Local notification scheduled:', notification.title);
      return true;
    } catch (error) {
      console.error('❌ Failed to schedule local notification:', error);
      return false;
    }
  }

  async sendPushNotification(notification: NotificationData, pushToken: string) {
    try {
      const message = {
        to: pushToken,
        sound: notification.sound ? 'default' : undefined,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        badge: notification.badge,
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      console.log('🔔 Push notification sent:', notification.title);
      return true;
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      return false;
    }
  }

  async showChatNotification(senderName: string, messageContent: string, conversationId: string) {
    const notification: NotificationData = {
      title: `💬 ${senderName}`,
      body: messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent,
      data: {
        type: 'chat',
        conversationId,
        senderName
      },
      sound: true,
      badge: 1,
    };

    // Send local notification
    await this.scheduleLocalNotification(notification);
    
    // If you have the recipient's push token, send push notification
    // await this.sendPushNotification(notification, recipientPushToken);
  }

  async showGroupChatNotification(groupName: string, senderName: string, messageContent: string, conversationId: string) {
    const notification: NotificationData = {
      title: `👥 ${groupName}`,
      body: `${senderName}: ${messageContent.length > 40 ? messageContent.substring(0, 40) + '...' : messageContent}`,
      data: {
        type: 'group_chat',
        conversationId,
        groupName,
        senderName
      },
      sound: true,
      badge: 1,
    };

    await this.scheduleLocalNotification(notification);
  }

  getExpoPushToken() {
    return this.expoPushToken;
  }

  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
      console.log('🔔 Badge cleared');
    } catch (error) {
      console.error('❌ Failed to clear badge:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🔔 All notifications cancelled');
    } catch (error) {
      console.error('❌ Failed to cancel notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
```

## Step 3: Update app.json

Add notification configuration to your `app.json`:

```json
{
  "expo": {
    "name": "my-expo-app",
    "slug": "my-expo-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.myexpoapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.myexpoapp",
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#ffffff",
      "iosDisplayInForeground": true,
      "androidMode": "default",
      "androidCollapsedTitle": "New Message"
    }
  }
}
```

## Step 4: Create Development Build

```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

## Step 5: Test Push Notifications

1. **Install the development build** on your device
2. **Grant notification permissions** when prompted
3. **Test local notifications** by sending a message
4. **Check notification panel** - you should see real push notifications

## Step 6: Server-Side Push Notifications (Optional)

For real-time push notifications from your server:

```typescript
// In your server code
const sendPushNotification = async (pushToken: string, message: string) => {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: pushToken,
      title: 'New Message',
      body: message,
      sound: 'default',
      badge: 1,
    }),
  });
  
  return response.json();
};
```

## Troubleshooting

### Permission Issues
- Make sure to grant notification permissions
- Check device settings for app permissions

### Token Issues
- Verify your Expo project ID
- Check that you're using a physical device (not simulator)

### Build Issues
- Clear cache: `npx expo start --clear`
- Rebuild: `npx expo run:android --clear`

## Alternative: Expo Push Notification Service

For easier setup, consider using Expo's push notification service:

1. Create an Expo account
2. Get your project ID
3. Use Expo's push notification API
4. Configure your server to send notifications

This will give you real push notifications that appear in the device notification panel!
