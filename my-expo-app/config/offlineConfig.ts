// Offline Configuration
export const OFFLINE_CONFIG = {
  // Enable/disable offline mode
  ENABLE_OFFLINE_MODE: true,
  
  // Show offline indicator
  SHOW_OFFLINE_INDICATOR: true,
  
  // Store status locally
  STORE_STATUS_LOCALLY: true,
  
  // Auto-cleanup old offline data (in milliseconds)
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  
  // Development mode settings
  DEVELOPMENT: {
    LOG_OFFLINE_ACTIONS: true,
    SHOW_DEBUG_INFO: true,
  },
  
  // Production mode settings
  PRODUCTION: {
    LOG_OFFLINE_ACTIONS: false,
    SHOW_DEBUG_INFO: false,
  }
};

// Get current configuration based on environment
export const getOfflineConfig = () => {
  return __DEV__ ? OFFLINE_CONFIG.DEVELOPMENT : OFFLINE_CONFIG.PRODUCTION;
};

// Helper functions
export const shouldLogOffline = (message: string) => {
  const config = getOfflineConfig();
  if (config.LOG_OFFLINE_ACTIONS) {
    console.log(`[Offline Mode] ${message}`);
  }
};

export const isOfflineModeEnabled = () => OFFLINE_CONFIG.ENABLE_OFFLINE_MODE;
export const shouldShowOfflineIndicator = () => OFFLINE_CONFIG.SHOW_OFFLINE_INDICATOR;
export const shouldStoreLocally = () => OFFLINE_CONFIG.STORE_STATUS_LOCALLY;
