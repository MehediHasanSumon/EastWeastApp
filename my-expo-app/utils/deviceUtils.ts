import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'device_unique_id';

/**
 * Get or generate a unique device identifier
 * This combines device model, OS version, and a stored unique ID
 */
export const getDeviceId = async (): Promise<string> => {
  try {
    // Try to get stored device ID first
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate a new device ID if none exists
      const deviceInfo = {
        model: Device.modelName || 'unknown',
        os: Device.osName || 'unknown',
        osVersion: Device.osVersion || 'unknown',
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
    return `mobile-${Device.modelName || 'unknown'}-${Date.now()}`;
  }
};

/**
 * Get device information for debugging
 */
export const getDeviceInfo = () => {
  return {
    brand: Device.brand,
    manufacturer: Device.manufacturer,
    modelName: Device.modelName,
    modelId: Device.modelId,
    designName: Device.designName,
    productName: Device.productName,
    deviceYearClass: Device.deviceYearClass,
    totalMemory: Device.totalMemory,
    supportedCpuArchitectures: Device.supportedCpuArchitectures,
    osName: Device.osName,
    osVersion: Device.osVersion,
    osBuildId: Device.osBuildId,
    osInternalBuildId: Device.osInternalBuildId,
    deviceName: Device.deviceName,
    deviceType: Device.deviceType,
  };
};

/**
 * Check if device is a physical device or simulator
 */
export const isPhysicalDevice = (): boolean => {
  return Device.isDevice;
};

/**
 * Get device type (tablet, phone, etc.)
 */
export const getDeviceType = (): string => {
  return Device.deviceType?.toString() || 'unknown';
};
