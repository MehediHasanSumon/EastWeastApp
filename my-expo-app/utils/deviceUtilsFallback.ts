import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'device_unique_id';

/**
 * Get or generate a unique device identifier (fallback version)
 * This generates a simple unique ID without expo-device dependency
 */
export const getDeviceId = async (): Promise<string> => {
  try {
    // Try to get stored device ID first
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate a new device ID if none exists
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        timestamp: Date.now().toString(),
        random: Math.random().toString(36).substring(2, 15)
      };
      
      deviceId = btoa(JSON.stringify(deviceInfo)).replace(/[^a-zA-Z0-9]/g, '');
      
      // Store the generated ID
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to a basic identifier
    return `mobile-${Platform.OS}-${Date.now()}`;
  }
};

/**
 * Get basic device information for debugging
 */
export const getDeviceInfo = () => {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    constants: Platform.constants,
  };
};

/**
 * Check if device is a physical device or simulator
 */
export const isPhysicalDevice = (): boolean => {
  // Simple check based on platform constants
  return Platform.OS === 'android' || Platform.OS === 'ios';
};

/**
 * Get device type (tablet, phone, etc.)
 */
export const getDeviceType = (): string => {
  // Simple device type detection based on platform
  if (Platform.OS === 'ios') {
    // iOS has better device type detection
    return 'phone'; // Default to phone for iOS
  }
  return 'phone'; // Default to phone for other platforms
};
