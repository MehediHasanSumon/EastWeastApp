import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme, useThemeReady } from '../../context/ThemeContext';
import { ChatMessage } from '../../types/chat';

interface DateSeparatorProps {
  message: ChatMessage;
  index: number;
  messages: ChatMessage[];
}

const DateSeparator: React.FC<DateSeparatorProps> = ({
  message,
  index,
  messages,
}) => {
  const isThemeReady = useThemeReady();
  
  // Don't render until theme is ready
  if (!isThemeReady) {
    return null;
  }
  
  const { theme } = useTheme();

  const prevMessage = index > 0 ? messages[index - 1] : null;
  
  if (!prevMessage) return null;
  
  const currentDate = new Date(message.createdAt).toDateString();
  const prevDate = new Date(prevMessage.createdAt).toDateString();
  
  if (currentDate !== prevDate) {
    return (
      <View style={styles.dateSeparator}>
        <View style={[styles.dateLine, { backgroundColor: theme.fontColor + '20' }]} />
        <View style={[styles.dateChip, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#FFFFFF' }]}>
          <Text style={[styles.dateText, { color: theme.fontColor + '99' }]}>
            {new Date(message.createdAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
        <View style={[styles.dateLine, { backgroundColor: theme.fontColor + '20' }]} />
      </View>
    );
  }
  
  return null;
};

const styles = StyleSheet.create({
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

export default DateSeparator;
