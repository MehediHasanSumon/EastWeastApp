import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUserStatus } from '../context/UserStatusContext';
import { Ionicons } from '@expo/vector-icons';

type UserStatusIndicatorProps = {
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLastSeen?: boolean;
};

const UserStatusIndicator: React.FC<UserStatusIndicatorProps> = ({
  showText = false,
  size = 'medium',
  showLastSeen = false,
}) => {
  const { userStatus, lastSeen, isOnline } = useUserStatus();

  const getStatusColor = () => {
    switch (userStatus) {
      case 'online':
        return '#10B981'; // Green
      case 'away':
        return '#F59E0B'; // Yellow
      case 'busy':
        return '#EF4444'; // Red
      case 'offline':
      default:
        return '#6B7280'; // Gray
    }
  };

  const getStatusIcon = () => {
    switch (userStatus) {
      case 'online':
        return 'ellipse';
      case 'away':
        return 'time';
      case 'busy':
        return 'pause-circle';
      case 'offline':
      default:
        return 'ellipse-outline';
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
      default:
        return 'Offline';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 8, height: 8, fontSize: 10 };
      case 'large':
        return { width: 16, height: 16, fontSize: 16 };
      case 'medium':
      default:
        return { width: 12, height: 12, fontSize: 12 };
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: getStatusColor(),
              width: sizeStyles.width,
              height: sizeStyles.height,
            },
          ]}
        />
        {showText && (
          <Text style={[styles.statusText, { fontSize: sizeStyles.fontSize }]}>
            {getStatusText()}
          </Text>
        )}
      </View>
      
      {showLastSeen && lastSeen && userStatus === 'offline' && (
        <Text style={styles.lastSeenText}>
          Last seen {formatLastSeen(lastSeen)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusText: {
    fontWeight: '500',
    color: '#374151',
  },
  lastSeenText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default UserStatusIndicator;
