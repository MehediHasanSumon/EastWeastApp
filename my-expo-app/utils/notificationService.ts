// Fallback notification service for Expo Go compatibility
// Since expo-notifications is deprecated in Expo Go SDK 53+, we'll use a simpler approach

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  sound?: boolean;
  badge?: number;
}

class NotificationService {
  private notificationQueue: NotificationData[] = [];
  private isInitialized = false;

  async initialize() {
    try {
      // In Expo Go, we can't request notification permissions
      // So we'll just mark as initialized and log the attempt
      console.log('🔔 Notification Service: Initialized (Expo Go Mode)');
      console.log('📱 Note: Push notifications are not supported in Expo Go');
      console.log('🚀 Use a development build for full notification support');
      console.log('📋 To get real push notifications in notification panel:');
      console.log('   1. Run: npx expo install expo-notifications expo-device');
      console.log('   2. Create development build: npx expo run:android');
      console.log('   3. Follow the guide in DEVELOPMENT_BUILD_SETUP.md');
      
      this.isInitialized = true;
      
      // Show any queued notifications
      this.processNotificationQueue();
      
      return true;
    } catch (error) {
      console.error('❌ Notification Service: Initialization failed', error);
      return false;
    }
  }

  async scheduleLocalNotification(notification: NotificationData) {
    try {
      if (!this.isInitialized) {
        this.notificationQueue.push(notification);
        return;
      }

      // In Expo Go, we'll just log the notification
      console.log('🔔 Local Notification (Expo Go Mode):', {
        title: notification.title,
        body: notification.body,
        timestamp: new Date().toISOString(),
        data: notification.data
      });

      console.log('📱 This would be a real push notification in development build');
      console.log('📋 To see notifications in device notification panel:');
      console.log('   - Create development build: npx expo run:android');
      console.log('   - Install on physical device');
      console.log('   - Grant notification permissions');

      // You could also show an in-app toast notification here
      this.showInAppNotification(notification);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to schedule local notification:', error);
      return false;
    }
  }

  async sendPushNotification(notification: NotificationData, pushToken: string) {
    try {
      // In Expo Go, we can't send push notifications
      console.log('🔔 Push Notification (Expo Go Mode):', {
        title: notification.title,
        body: notification.body,
        pushToken: pushToken.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      });

      console.log('📱 This would send a real push notification in development build');
      console.log('📋 To enable real push notifications:');
      console.log('   1. Follow DEVELOPMENT_BUILD_SETUP.md');
      console.log('   2. Use physical device (not simulator)');
      console.log('   3. Grant notification permissions');

      // Fallback to local notification
      await this.scheduleLocalNotification(notification);
      
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
      }
    };

    await this.scheduleLocalNotification(notification);
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
      }
    };

    await this.scheduleLocalNotification(notification);
  }

  getExpoPushToken() {
    // In Expo Go, we can't get push tokens
    console.log('🔔 Expo Push Token: Not available in Expo Go');
    console.log('📋 To get push tokens:');
    console.log('   1. Create development build');
    console.log('   2. Use physical device');
    console.log('   3. Install expo-notifications package');
    return null;
  }

  async clearBadge() {
    // In Expo Go, we can't clear badges
    console.log('🔔 Badge cleared (Expo Go Mode)');
  }

  async cancelAllNotifications() {
    // In Expo Go, we can't cancel notifications
    console.log('🔔 All notifications cancelled (Expo Go Mode)');
  }

  // Helper method to show in-app notifications
  private showInAppNotification(notification: NotificationData) {
    // Log the notification
    console.log('📱 In-App Notification:', notification.title, '-', notification.body);
    
    // Note: In a real app, you would inject the toast function here
    // For now, we'll just log it. The Toast component can be used directly in UI components
    // by calling the useToast hook
  }

  // Process any notifications that were queued before initialization
  private processNotificationQueue() {
    if (this.notificationQueue.length > 0) {
      console.log(`🔔 Processing ${this.notificationQueue.length} queued notifications`);
      
      this.notificationQueue.forEach(async (notification) => {
        await this.scheduleLocalNotification(notification);
      });
      
      this.notificationQueue = [];
    }
  }

  // Method to check if we're running in Expo Go
  isExpoGo() {
    return !this.isInitialized || process.env.EXPO_PUBLIC_USE_DEV_CLIENT !== 'true';
  }

  // Method to get notification status
  getNotificationStatus() {
    if (this.isExpoGo()) {
      return {
        available: false,
        mode: 'expo-go',
        message: 'Push notifications not supported in Expo Go. Use development build for full support.'
      };
    }
    
    return {
      available: true,
      mode: 'development-build',
      message: 'Push notifications are available'
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
