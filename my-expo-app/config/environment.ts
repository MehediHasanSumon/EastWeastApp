// Environment Configuration
export const ENV = {
  // Backend Configuration
  BACKEND_HOST: process.env.EXPO_PUBLIC_BACKEND_HOST || (__DEV__ ? 'http://10.0.2.2:8000' : 'https://your-production-backend.com'),
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || (__DEV__ ? 'ws://10.0.2.2:8000' : 'wss://your-production-backend.com'),
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEV: __DEV__,
  IS_PROD: !__DEV__,
  
  // Feature Flags
  ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  
  // API Configuration
  API_TIMEOUT: 30000, // 30 seconds
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  SUPPORTED_AUDIO_TYPES: ['audio/m4a', 'audio/mp3', 'audio/wav'],
  SUPPORTED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// Helper functions
export const isProduction = () => ENV.IS_PROD;
export const isDevelopment = () => ENV.IS_DEV;
export const getBackendUrl = () => ENV.BACKEND_HOST;
export const getSocketUrl = () => ENV.SOCKET_URL;
