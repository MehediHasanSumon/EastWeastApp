import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';

const { width } = Dimensions.get('window');

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onReactionSelect: (emoji: string, type: string) => void;
  messageId: string;
  currentReactions?: { [userId: string]: { type: string; emoji: string; timestamp: string } };
  currentUserId?: string;
}

// Map emojis to backend reaction types
const REACTION_EMOJIS = [
  { emoji: '👍', type: 'like' },
  { emoji: '❤️', type: 'love' },
  { emoji: '😀', type: 'laugh' },
  { emoji: '😢', type: 'sad' },
  { emoji: '😡', type: 'angry' },
  { emoji: '🎉', type: 'wow' }
];

const ReactionPicker: React.FC<ReactionPickerProps> = ({
  visible,
  onClose,
  onReactionSelect,
  messageId,
  currentReactions = {},
  currentUserId,
}) => {
  const { theme } = useContext(ThemeContext);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const handleReactionSelect = (emoji: string, type: string) => {
    setSelectedEmoji(emoji);
    onReactionSelect(emoji, type);
    onClose();
  };

  const getReactionCount = (emoji: string) => {
    return Object.values(currentReactions).filter(reaction => reaction.emoji === emoji).length;
  };

  const hasUserReacted = (emoji: string) => {
    if (!currentUserId) return false;
    return currentReactions[currentUserId]?.emoji === emoji;
  };

          const renderEmojiItem = ({ item }: { item: { emoji: string; type: string } }) => {
          const count = getReactionCount(item.emoji);
          const isUserReaction = hasUserReacted(item.emoji);

          return (
            <TouchableOpacity
              style={[
                styles.emojiButton,
                {
                  backgroundColor: isUserReaction
                    ? (theme.mode === 'dark' ? '#4CAF50' : '#4CAF50')
                    : (theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5'),
                  borderColor: isUserReaction ? '#4CAF50' : 'transparent',
                }
              ]}
              onPress={() => handleReactionSelect(item.emoji, item.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiText}>{item.emoji}</Text>
              {count > 0 && (
                <View style={[
                  styles.countBadge,
                  {
                    backgroundColor: theme.mode === 'dark' ? '#1A1A1A' : '#FFFFFF',
                  }
                ]}>
                  <Text style={[
                    styles.countText,
                    { color: theme.fontColor }
                  ]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[
          styles.container,
          {
            backgroundColor: theme.mode === 'dark' ? '#242526' : '#FFFFFF',
            borderColor: theme.mode === 'dark' ? '#3A3B3C' : '#E4E6EB',
          }
        ]}>
          <View style={styles.header}>
            <Text style={[
              styles.headerTitle,
              { color: theme.fontColor }
            ]}>
              Add Reaction
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons 
                name="close" 
                size={24} 
                color={theme.fontColor} 
              />
            </TouchableOpacity>
          </View>
          
                            <FlatList
                    data={REACTION_EMOJIS}
                    renderItem={renderEmojiItem}
                    keyExtractor={(item) => item.type}
                    numColumns={5}
                    contentContainerStyle={styles.emojiGrid}
                    showsVerticalScrollIndicator={false}
                  />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxHeight: 400,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  emojiGrid: {
    padding: 20,
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    borderWidth: 2,
    position: 'relative',
  },
  emojiText: {
    fontSize: 24,
  },
  countBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E4E6EB',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ReactionPicker;
