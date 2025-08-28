import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';
import { ChatMessage, ChatUser } from '../types/chat';

const { width } = Dimensions.get('window');

interface MessageReactionsProps {
  message: ChatMessage;
  onReactionPress: (emoji: string) => void;
  onReactionLongPress: (emoji: string) => void;
}

interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  message,
  onReactionPress,
  onReactionLongPress,
}) => {
  const { theme } = useContext(ThemeContext);
  const [showReactionDetails, setShowReactionDetails] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<ReactionGroup | null>(null);

  // Group reactions by emoji
  const reactionGroups: ReactionGroup[] = Object.entries(message.reactions).reduce((acc, [userId, reaction]) => {
    const existingGroup = acc.find(group => group.emoji === reaction.emoji);
    if (existingGroup) {
      existingGroup.count++;
      existingGroup.users.push(userId);
    } else {
      acc.push({
        emoji: reaction.emoji,
        count: 1,
        users: [userId],
      });
    }
    return acc;
  }, [] as ReactionGroup[]);

  if (reactionGroups.length === 0) return null;

  const handleReactionPress = (emoji: string) => {
    onReactionPress(emoji);
  };

  const handleReactionLongPress = (reaction: ReactionGroup) => {
    setSelectedReaction(reaction);
    setShowReactionDetails(true);
  };

  const renderReactionItem = ({ item }: { item: ReactionGroup }) => (
    <TouchableOpacity
      style={[
        styles.reactionItem,
        { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }
      ]}
      onPress={() => handleReactionPress(item.emoji)}
      onLongPress={() => handleReactionLongPress(item)}
      delayLongPress={500}
    >
      <Text style={styles.reactionEmoji}>{item.emoji}</Text>
      <Text style={[styles.reactionCount, { color: theme.fontColor }]}>
        {item.count}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.reactionsContainer}>
        {reactionGroups.map((reaction, index) => (
          <TouchableOpacity
            key={`${reaction.emoji}-${index}`}
            style={[
              styles.reactionItem,
              { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }
            ]}
            onPress={() => handleReactionPress(reaction.emoji)}
            onLongPress={() => handleReactionLongPress(reaction)}
            delayLongPress={500}
          >
            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
            <Text style={[styles.reactionCount, { color: theme.fontColor }]}>
              {reaction.count}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reaction Details Modal */}
      <Modal
        visible={showReactionDetails}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactionDetails(false)}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          onPress={() => setShowReactionDetails(false)} 
          activeOpacity={1}
        >
          <View style={[styles.detailsContainer, { backgroundColor: theme.mode === 'dark' ? '#242526' : '#FFFFFF' }]}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsEmoji}>{selectedReaction?.emoji}</Text>
              <Text style={[styles.detailsTitle, { color: theme.fontColor }]}>
                {selectedReaction?.emoji} Reactions
              </Text>
            </View>
            
            <View style={styles.detailsContent}>
              <Text style={[styles.detailsSubtitle, { color: theme.fontColor + '99' }]}>
                {selectedReaction?.count} people reacted
              </Text>
              
              <FlatList
                data={selectedReaction?.users || []}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <View style={styles.userItem}>
                    <View style={styles.userAvatar}>
                      <Ionicons name="person" size={16} color={theme.fontColor + '66'} />
                    </View>
                    <Text style={[styles.userName, { color: theme.fontColor }]}>
                      User {item.substring(0, 8)}...
                    </Text>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}
              onPress={() => setShowReactionDetails(false)}
            >
              <Text style={[styles.closeButtonText, { color: theme.fontColor }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 4,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    minWidth: 32,
    justifyContent: 'center',
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  detailsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  detailsContent: {
    marginBottom: 20,
  },
  detailsSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MessageReactions;
