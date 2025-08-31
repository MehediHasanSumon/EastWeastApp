import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStatus } from '../context/UserStatusContext';

const SimpleUserStatus: React.FC = () => {
  const { userStatus, lastSeen } = useUserStatus();

  const getStatusColor = () => {
    switch (userStatus) {
      case 'online':
        return '#10B981'; // Green
      case 'away':
        return '#F59E0B'; // Yellow
      case 'busy':
        return '#EF4444'; // Red
      case 'offline':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = () => {
    switch (userStatus) {
      case 'online':
        return 'radio-button-on';
      case 'away':
        return 'time';
      case 'busy':
        return 'pause-circle';
      case 'offline':
        return 'radio-button-off';
      default:
        return 'radio-button-off';
    }
  };

  const getStatusText = () => {
    switch (userStatus) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Ionicons 
          name={getStatusIcon() as any} 
          size={16} 
          color={getStatusColor()} 
        />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
      
      {lastSeen && (
        <Text style={styles.lastSeenText}>
          Last seen: {lastSeen.toLocaleTimeString()}
        </Text>
      )}
      
      <Text style={styles.infoText}>
        Status updates are stored locally
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastSeenText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default SimpleUserStatus;
