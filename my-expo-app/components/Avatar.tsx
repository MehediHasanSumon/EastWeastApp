import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme, useThemeReady } from '../context/ThemeContext';

interface AvatarProps {
  user?: {
    name?: string;
    avatar?: string;
  };
  size?: number;
  onPress?: () => void;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
  isGroup?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  user,
  size = 40,
  onPress,
  showOnlineIndicator = false,
  isOnline = false,
  isGroup = false,
}) => {
  const isThemeReady = useThemeReady();
  
  // Don't render until theme is ready
  if (!isThemeReady) {
    return null;
  }
  
  const { theme } = useTheme();

  // Generate a consistent color based on the user's name
  const getInitialsColor = (name: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
      '#F9E79F', '#A9DFBF', '#FAD7A0', '#D5A6BD', '#AED6F1'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Get initials from name
  const getInitials = (name: string): string => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return name.charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Get avatar source
  const getAvatarSource = () => {
    if (user?.avatar) {
      return { uri: user.avatar };
    }
    
    return null;
  };

  // Get group name for initials
  const getGroupName = () => {
    if (isGroup) {
      return user?.name || 'Group';
    }
    return user?.name || 'Unknown';
  };

  const avatarSize = size;
  const fontSize = Math.max(12, Math.floor(size * 0.4));
  const onlineIndicatorSize = Math.max(8, Math.floor(size * 0.2));

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container 
      style={[styles.container, { width: avatarSize, height: avatarSize }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
              {getAvatarSource() ? (
          // Show user's actual photo
          <Image
            source={getAvatarSource()!}
            style={[
              styles.image,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              }
            ]}
            resizeMode="cover"
          />
        ) : (
        // Show initials with colored background
        <View
          style={[
            styles.initialsContainer,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: getInitialsColor(getGroupName()),
            }
          ]}
        >
                      <Text
              style={[
                styles.initialsText,
                {
                  fontSize,
                  color: '#FFFFFF',
                }
              ]}
            >
              {getInitials(getGroupName())}
            </Text>
        </View>
      )}
      
      {/* Online indicator */}
      {showOnlineIndicator && isOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: onlineIndicatorSize,
              height: onlineIndicatorSize,
              borderRadius: onlineIndicatorSize / 2,
              borderWidth: 2,
              borderColor: theme.mode === 'dark' ? '#1A1A1A' : '#FFFFFF',
            }
          ]}
        />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    borderWidth: 2,
    borderColor: '#E4E6EB',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E4E6EB',
  },
  initialsText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#4CAF50',
  },
});

export default Avatar;
