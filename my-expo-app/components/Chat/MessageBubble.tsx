import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { useContext } from 'react';
import { IMessage } from '../../types/chat';

const { width } = Dimensions.get('window');

interface MessageBubbleProps {
  message: IMessage;
  isOwnMessage: boolean;
  onReaction: (messageId: string, reactionType: string, emoji: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  currentUser: any;
  onReply: (message: IMessage) => void;
  onForward: (message: IMessage) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  onReaction,
  onEdit,
  onDelete,
  currentUser,
  onReply,
  onForward,
}) => {
  const { theme } = useContext(ThemeContext);
  const [showActions, setShowActions] = useState(false);

  const handleLongPress = () => {
    setShowActions(true);
  };

  const handleReaction = (emoji: string) => {
    onReaction(message._id, 'like', emoji);
    setShowActions(false);
  };

  const handleEdit = () => {
    if (message.content) {
      onEdit(message._id, message.content);
    }
    setShowActions(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(message._id) },
      ]
    );
    setShowActions(false);
  };

  const handleReply = () => {
    onReply(message);
    setShowActions(false);
  };

  const handleForward = () => {
    onForward(message);
    setShowActions(false);
  };

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'text':
        return (
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? '#fff' : theme.fontColor }
          ]}>
            {message.content}
          </Text>
        );
      case 'image':
        return (
          <View style={styles.imageContainer}>
            <Text style={[styles.messageText, { color: theme.fontColor }]}>
              📷 Image
            </Text>
          </View>
        );
      case 'file':
        return (
          <View style={styles.fileContainer}>
            <Ionicons name="document" size={24} color={theme.fontColor} />
            <Text style={[styles.messageText, { color: theme.fontColor }]}>
              📎 File
            </Text>
          </View>
        );
      case 'voice':
        return (
          <View style={styles.voiceContainer}>
            <Ionicons name="mic" size={20} color={theme.fontColor} />
            <Text style={[styles.messageText, { color: theme.fontColor }]}>
              🎤 Voice Message
            </Text>
          </View>
        );
      default:
        return (
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? '#fff' : theme.fontColor }
          ]}>
            {message.content}
          </Text>
        );
    }
  };

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      <TouchableOpacity
        style={[
          styles.bubble,
          {
            backgroundColor: isOwnMessage ? '#0084FF' : theme.bgColor,
            borderColor: isOwnMessage ? '#0084FF' : theme.bgColor,
          }
        ]}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
      >
        {message.replyTo && (
          <View style={styles.replyContainer}>
            <Text style={[styles.replyText, { color: theme.fontColor + '80' }]}>
              Replying to: {message.replyTo.content?.substring(0, 50)}...
            </Text>
          </View>
        )}
        
        {renderMessageContent()}
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            { color: isOwnMessage ? '#fff' : theme.fontColor + '80' }
          ]}>
            {formatTime(message.timestamp)}
          </Text>
          
          {isOwnMessage && (
            <View style={styles.statusContainer}>
              {message.readBy && message.readBy.length > 0 ? (
                <Ionicons name="checkmark-done" size={16} color="#34C759" />
              ) : (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {showActions && (
        <View style={[
          styles.actionsContainer,
                  {
          backgroundColor: theme.bgColor,
          borderColor: theme.bgColor,
        }
        ]}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleReaction('👍')}>
            <Text style={[styles.actionText, { color: theme.fontColor }]}>👍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleReaction('❤️')}>
            <Text style={[styles.actionText, { color: theme.fontColor }]}>❤️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleReaction('😂')}>
            <Text style={[styles.actionText, { color: theme.fontColor }]}>😂</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
            <Ionicons name="arrow-undo" size={20} color={theme.fontColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleForward}>
            <Ionicons name="arrow-forward" size={20} color={theme.fontColor} />
          </TouchableOpacity>
          {message.sender._id === currentUser?._id && (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                <Ionicons name="create" size={20} color={theme.fontColor} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Ionicons name="trash" size={20} color={theme.fontColor} />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: width * 0.75,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  replyContainer: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  replyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  imageContainer: {
    alignItems: 'center',
    padding: 16,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timestamp: {
    fontSize: 12,
  },
  statusContainer: {
    marginLeft: 8,
  },
  actionsContainer: {
    position: 'absolute',
    top: -50,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButton: {
    padding: 8,
    marginHorizontal: 2,
  },
  actionText: {
    fontSize: 18,
  },
});

export default MessageBubble;
