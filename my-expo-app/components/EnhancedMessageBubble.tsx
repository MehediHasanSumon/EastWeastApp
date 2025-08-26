import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';
import { ChatMessage } from '../types/chat';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

interface EnhancedMessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  onReact: (emoji: string) => void;
  onEdit: (newContent: string) => void;
  onDelete: (deleteForEveryone: boolean) => void;
  onReply: () => void;
  onForward: () => void;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🙏', '🔥', '💯'];

const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({
  message,
  isOwnMessage,
  onReact,
  onEdit,
  onDelete,
  onReply,
  onForward,
}) => {
  const { theme } = useContext(ThemeContext);
  const [showReactions, setShowReactions] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleVoicePlayback = async () => {
    try {
      if (isPlaying && sound) {
        await sound.stopAsync();
        setIsPlaying(false);
      } else if (message.mediaUrl) {
        if (sound) {
          await sound.playAsync();
          setIsPlaying(true);
        } else {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: message.mediaUrl },
            { shouldPlay: true }
          );
          setSound(newSound);
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error playing voice message:', error);
    }
  };

  const getMessageContent = () => {
    if (message.isDeleted) {
      return (
        <Text style={[styles.deletedText, { color: theme.fontColor + '66' }]}>
          This message was deleted
        </Text>
      );
    }

    switch (message.messageType) {
      case 'image':
        return (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: message.mediaUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {message.content && (
              <Text style={[styles.imageCaption, { color: theme.fontColor }]}>
                {message.content}
              </Text>
            )}
          </View>
        );

      case 'voice':
        return (
          <View style={styles.voiceContainer}>
            <TouchableOpacity
              style={[styles.voiceButton, { backgroundColor: '#0084FF' }]}
              onPress={toggleVoicePlayback}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
            <View style={styles.voiceInfo}>
              <Text style={[styles.voiceDuration, { color: theme.fontColor + 'CC' }]}>
                {message.duration ? `${Math.round(message.duration)}s` : 'Voice message'}
              </Text>
            </View>
          </View>
        );

      case 'file':
        return (
          <View style={[styles.fileContainer, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
            <View style={styles.fileIcon}>
              <Ionicons name="document" size={32} color="#0084FF" />
            </View>
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: theme.fontColor }]} numberOfLines={2}>
                {message.fileName || 'Document'}
              </Text>
              {message.fileSize && (
                <Text style={[styles.fileSize, { color: theme.fontColor + '99' }]}>
                  {(message.fileSize / 1024).toFixed(1)} KB
                </Text>
              )}
            </View>
          </View>
        );

      default:
        return (
          <Text style={[styles.messageText, { color: theme.fontColor }]}>
            {message.content}
          </Text>
        );
    }
  };

  return (
    <View style={styles.container}>
      {message.replyTo && (
        <View style={[styles.replyPreview, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
          <Text style={[styles.replyText, { color: theme.fontColor + '99' }]} numberOfLines={1}>
            {message.replyTo.content}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.messageBubble,
          {
            backgroundColor: isOwnMessage
              ? '#0084FF'
              : theme.mode === 'dark'
              ? '#3A3B3C'
              : '#F0F2F5',
          },
        ]}
      >
        {getMessageContent()}
        
        <View style={styles.messageFooter}>
          <Text style={[styles.timestamp, { color: isOwnMessage ? '#fff' : theme.fontColor + '99' }]}>
            {formatTime(message.createdAt)}
          </Text>
          
          {isOwnMessage && (
            <View style={styles.messageStatus}>
              {message.deliveredTo.length > 0 && (
                <Ionicons name="checkmark-done" size={16} color="#fff" />
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowReactions(!showReactions)}
        >
          <Ionicons name="add" size={16} color={theme.fontColor + '66'} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowActions(!showActions)}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color={theme.fontColor + '66'} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showReactions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactions(false)}
      >
        <TouchableOpacity
          style={styles.reactionsOverlay}
          onPress={() => setShowReactions(false)}
          activeOpacity={1}
        >
          <View style={[styles.reactionsModal, { backgroundColor: theme.mode === 'dark' ? '#242526' : '#FFFFFF' }]}>
            <View style={styles.reactionsGrid}>
              {REACTION_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionButton}
                  onPress={() => {
                    onReact(emoji);
                    setShowReactions(false);
                  }}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showActions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableOpacity
          style={styles.actionsOverlay}
          onPress={() => setShowActions(false)}
          activeOpacity={1}
        >
          <View style={[styles.actionsModal, { backgroundColor: theme.mode === 'dark' ? '#242526' : '#FFFFFF' }]}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onReply();
                setShowActions(false);
              }}
            >
              <Ionicons name="arrow-undo" size={20} color={theme.fontColor} />
              <Text style={[styles.actionText, { color: theme.fontColor }]}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onForward();
                setShowActions(false);
              }}
            >
              <Ionicons name="arrow-forward" size={20} color={theme.fontColor} />
              <Text style={[styles.actionText, { color: theme.fontColor }]}>Forward</Text>
            </TouchableOpacity>

            {isOwnMessage && message.canEdit && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  onEdit(message.content);
                  setShowActions(false);
                }}
              >
                <Ionicons name="create-outline" size={20} color={theme.fontColor} />
                <Text style={[styles.actionText, { color: theme.fontColor }]}>Edit</Text>
              </TouchableOpacity>
            )}

            {isOwnMessage && message.canDelete && (
              <TouchableOpacity
                style={[styles.actionItem, styles.deleteAction]}
                onPress={() => {
                  Alert.alert(
                    'Delete Message',
                    'Do you want to delete this message for everyone?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          onDelete(true);
                          setShowActions(false);
                        },
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: width * 0.75,
  },
  replyPreview: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#0084FF',
  },
  replyText: {
    fontSize: 11,
  },
  messageBubble: {
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  deletedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  imageCaption: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 150,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceDuration: {
    fontSize: 12,
    textAlign: 'center',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 200,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timestamp: {
    fontSize: 11,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginRight: 12,
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  reactionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionsModal: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  reactionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  reactionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    backgroundColor: '#F0F2F5',
  },
  reactionEmoji: {
    fontSize: 24,
  },
  actionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionsModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  deleteAction: {
    backgroundColor: '#FF3B3010',
  },
});

export default EnhancedMessageBubble;
