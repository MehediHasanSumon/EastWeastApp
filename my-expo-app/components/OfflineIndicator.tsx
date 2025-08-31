import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useUserStatus } from '../context/UserStatusContext';
import { shouldLog } from '../config/userStatusConfig';

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Since backend is not implemented, always show offline indicator
    const checkOfflineStatus = async () => {
      try {
        // Always show offline indicator for now
        setIsOffline(true);
        showOfflineIndicator();
      } catch (error) {
        shouldLog('Failed to check offline status', 'error');
      }
    };

    checkOfflineStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkOfflineStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const showOfflineIndicator = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideOfflineIndicator = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Ionicons name="cloud-offline" size={16} color="#EF4444" />
      <Text style={styles.text}>Offline mode - Backend not implemented</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  text: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
});

export default OfflineIndicator;
