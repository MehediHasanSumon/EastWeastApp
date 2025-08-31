import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useTheme, useThemeReady } from '../../context/ThemeContext';
import { TypingUser } from '../../types/chat';

const { width } = Dimensions.get('window');

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  currentUserId: string | null;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  currentUserId,
}) => {
  const isThemeReady = useThemeReady();
  
  // Don't render until theme is ready
  if (!isThemeReady) {
    return null;
  }
  
  const { theme } = useTheme();

  // Filter out current user from typing indicators
  const otherTypingUsers = typingUsers.filter(u => u.userId !== currentUserId);

  if (otherTypingUsers.length === 0) return null;

  return (
    <Animated.View style={styles.typingContainer}>
      <View style={[styles.typingBubble, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
        <View style={styles.typingContent}>
          <View style={styles.typingDots}>
            <Animated.View style={[styles.dot, styles.dot1, { backgroundColor: theme.fontColor + '66' }]} />
            <Animated.View style={[styles.dot, styles.dot2, { backgroundColor: theme.fontColor + '66' }]} />
            <Animated.View style={[styles.dot, styles.dot3, { backgroundColor: theme.fontColor + '66' }]} />
          </View>
          <Text style={[styles.typingText, { color: theme.fontColor + '99' }]}>
            {otherTypingUsers.map(u => u.userName).join(', ')} {otherTypingUsers.length === 1 ? 'is' : 'are'} typing
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  typingContainer: {
    marginVertical: 8,
    alignSelf: 'flex-start',
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    maxWidth: width * 0.6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  typingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 3,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  typingText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default TypingIndicator;
