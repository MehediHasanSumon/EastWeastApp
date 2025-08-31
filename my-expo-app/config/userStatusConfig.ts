// User Status Configuration
export const USER_STATUS_CONFIG = {
  // Production settings
  PRODUCTION: {
    // Disable console logs in production
    enableLogging: false,
    
    // Retry settings for offline scenarios
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    
    // Heartbeat settings
    heartbeatInterval: 30000, // 30 seconds
    heartbeatTimeout: 10000, // 10 seconds
    
    // Auto-away settings
    autoAwayDelay: 5 * 60 * 1000, // 5 minutes
    
    // Offline storage settings
    enableOfflineStorage: true,
    maxOfflineDataAge: 24 * 60 * 60 * 1000, // 24 hours
    
    // Error handling
    gracefulDegradation: true,
    continueOnError: true,
  },
  
  // Development settings
  DEVELOPMENT: {
    enableLogging: true,
    maxRetries: 5,
    retryDelay: 2000,
    heartbeatInterval: 30000,
    heartbeatTimeout: 5000,
    autoAwayDelay: 5 * 60 * 1000,
    enableOfflineStorage: true,
    maxOfflineDataAge: 24 * 60 * 60 * 1000,
    gracefulDegradation: true,
    continueOnError: true,
  }
};

// Get current configuration based on environment
export const getCurrentConfig = () => {
  return __DEV__ ? USER_STATUS_CONFIG.DEVELOPMENT : USER_STATUS_CONFIG.PRODUCTION;
};

// Helper functions
export const shouldLog = (message: string, level: 'error' | 'warn' | 'info' = 'info') => {
  const config = getCurrentConfig();
  if (!config.enableLogging) return;
  
  switch (level) {
    case 'error':
      console.error(message);
      break;
    case 'warn':
      console.warn(message);
      break;
    case 'info':
      console.log(message);
      break;
  }
};

export const isProduction = () => !__DEV__;
export const isDevelopment = () => __DEV__;
