import React, { createContext, ReactNode, useContext, useState, useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "./AuthContext";
// Try to use expo-device first, fallback to basic implementation if needed
import { getDeviceId } from "../utils/deviceUtils";
import { shouldLogOffline } from "../config/offlineConfig";

type UserStatus = 'online' | 'offline' | 'away' | 'busy';

type UserStatusContextType = {
  userStatus: UserStatus;
  lastSeen: Date | null;
  isOnline: boolean;
  updateStatus: (status: UserStatus) => Promise<void>;
  setAway: () => void;
  setOnline: () => void;
  setOffline: () => void;
  setBusy: () => void;
  syncOfflineData: () => Promise<void>;
};

const UserStatusContext = createContext<UserStatusContextType | undefined>(undefined);

type UserStatusProviderProps = {
  children: ReactNode;
};

export const UserStatusProvider = ({ children }: UserStatusProviderProps) => {
  const { user, isAuthenticated } = useAuth();
  const [userStatus, setUserStatus] = useState<UserStatus>('offline');
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const appState = useRef(AppState.currentState);
  const statusUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const awayTimeout = useRef<NodeJS.Timeout | null>(null);

  // Update user status on the server (currently disabled - backend not implemented)
  const updateServerStatus = async (status: UserStatus) => {
    if (!isAuthenticated || !user) return;
    
    // Store status locally since backend endpoints are not available
    try {
      await AsyncStorage.setItem('user_status_offline', JSON.stringify({
        status,
        lastSeen: new Date().toISOString(),
        timestamp: Date.now()
      }));
      
      shouldLogOffline(`Status stored locally: ${status}`);
    } catch (storageError) {
      if (__DEV__) {
        console.error('Failed to store status locally:', storageError);
      }
    }
  };

  // Sync offline data when backend becomes available (currently disabled)
  const syncOfflineData = async () => {
    if (!isAuthenticated || !user) return;
    
    shouldLogOffline('Offline data sync disabled - backend not implemented');
    
    // For now, just clean up old offline data
    try {
      const offlineStatus = await AsyncStorage.getItem('user_status_offline');
      const offlineHeartbeat = await AsyncStorage.getItem('heartbeat_offline');
      
      if (offlineStatus || offlineHeartbeat) {
        shouldLogOffline('Cleaning up offline data');
        await AsyncStorage.removeItem('user_status_offline');
        await AsyncStorage.removeItem('heartbeat_offline');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to clean up offline data:', error);
      }
    }
  };

  // Update local status and sync with server
  const updateStatus = async (status: UserStatus) => {
    setUserStatus(status);
    setLastSeen(new Date());
    await updateServerStatus(status);
  };

  // Set user as away (inactive for 5 minutes)
  const setAway = () => {
    if (awayTimeout.current) {
      clearTimeout(awayTimeout.current);
    }
    
    awayTimeout.current = setTimeout(() => {
      if (userStatus === 'online') {
        updateStatus('away');
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  // Set user as online
  const setOnline = () => {
    if (awayTimeout.current) {
      clearTimeout(awayTimeout.current);
    }
    updateStatus('online');
  };

  // Set user as offline
  const setOffline = () => {
    if (awayTimeout.current) {
      clearTimeout(awayTimeout.current);
    }
    updateStatus('offline');
  };

  // Set user as busy
  const setBusy = () => {
    if (awayTimeout.current) {
      clearTimeout(awayTimeout.current);
    }
    updateStatus('busy');
  };

  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (!isAuthenticated || !user) return;

    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App became active
      setOnline();
      setAway(); // Start away timer
    } else if (nextAppState.match(/inactive|background/)) {
      // App became inactive or went to background
      if (awayTimeout.current) {
        clearTimeout(awayTimeout.current);
      }
      updateStatus('away');
    }

    appState.current = nextAppState;
  };

  // Start periodic status updates when online
  const startStatusUpdates = () => {
    if (statusUpdateInterval.current) {
      clearInterval(statusUpdateInterval.current);
    }

    statusUpdateInterval.current = setInterval(async () => {
      if (isAuthenticated && user && userStatus === 'online') {
        // Store heartbeat locally since backend endpoints are not available
        try {
          await AsyncStorage.setItem('heartbeat_offline', JSON.stringify({
            timestamp: Date.now(),
            deviceId: await getDeviceId()
          }));
          
          shouldLogOffline('Heartbeat stored locally');
        } catch (storageError) {
          if (__DEV__) {
            console.error('Failed to store heartbeat locally:', storageError);
          }
        }
      }
    }, 30000); // Every 30 seconds
  };

  // Stop periodic status updates
  const stopStatusUpdates = () => {
    if (statusUpdateInterval.current) {
      clearInterval(statusUpdateInterval.current);
      statusUpdateInterval.current = null;
    }
  };

  // Initialize user status when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setOnline();
      setAway();
      startStatusUpdates();
      
      // Try to sync any offline data
      setTimeout(() => {
        syncOfflineData();
      }, 1000); // Wait 1 second before attempting sync
    } else {
      setOffline();
      stopStatusUpdates();
    }

    return () => {
      stopStatusUpdates();
      if (awayTimeout.current) {
        clearTimeout(awayTimeout.current);
      }
    };
  }, [isAuthenticated, user]);

  // Set up app state listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStatusUpdates();
      if (awayTimeout.current) {
        clearTimeout(awayTimeout.current);
      }
    };
  }, []);

  const value: UserStatusContextType = {
    userStatus,
    lastSeen,
    isOnline: userStatus === 'online',
    updateStatus,
    setAway,
    setOnline,
    setOffline,
    setBusy,
    syncOfflineData,
  };

  return (
    <UserStatusContext.Provider value={value}>
      {children}
    </UserStatusContext.Provider>
  );
};

// Custom hook to use the user status context
export const useUserStatus = () => {
  const context = useContext(UserStatusContext);
  if (!context) {
    throw new Error("useUserStatus must be used within a UserStatusProvider");
  }
  return context;
};
