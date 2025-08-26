import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { useContext } from 'react';
import { IConversation, IMessage } from '../../types/chat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const { width, height } = Dimensions.get('window');

interface ChatInterfaceProps {
  conversation: IConversation;
  messages: IMessage[];
  typingUsers: string[];
  onSendMessage: (content: string, messageType?: string, mediaUrl?: string, durationSeconds?: number, replyToId?: string) => void;
  onTyping: (isTyping: boolean) => void;
  onMessageReaction: (messageId: string, reactionType: string, emoji: string) => void;
  onMessageEdit: (messageId: string, content: string) => void;
  onMessageDelete: (messageId: string) => void;
  onMarkAsRead: (messageId: string) => void;
  onConversationUpdate?: (conversation: IConversation) => void;
  currentUser: any;
  onToggleSidebar?: () => void;
  onLoadOlder?: () => Promise<void>;
  hasMoreOlder?: boolean;
  isLoadingOlder?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversation,
  messages,
  typingUsers,
  onSendMessage,
  onTyping,
  onMessageReaction,
  onMessageEdit,
  onMessageDelete,
  onMarkAsRead,
  onConversationUpdate,
  currentUser,
  onToggleSidebar,
  onLoadOlder,
  hasMoreOlder = false,
  isLoadingOlder = false,
}) => {
  const { theme } = useContext(ThemeContext);
  const [replyToMessage, setReplyToMessage] = useState<IMessage | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<FlatList>(null);
  const messagesContainerRef = useRef<View>(null);

  const currentUserId: string | undefined = currentUser?.id || currentUser?._id;

  useEffect(() => {
    if (messages.length > 0 && !isLoadingOlder) {
      scrollToBottom();
    }
  }, [messages, isLoadingOlder]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollToEnd({ animated: true });
  };

  const handleScroll = async (event: any) => {
    const { contentOffset } = event.nativeEvent;
    if (contentOffset.y <= 100 && hasMoreOlder && !isLoadingOlder && onLoadOlder) {
      await onLoadOlder();
    }
  };

  const handleSendMessage = async (content: string, messageType = 'text', mediaUrl?: string, durationSeconds?: number) => {
    try {
      await onSendMessage(content, messageType, mediaUrl, durationSeconds, replyToMessage?._id);
      setReplyToMessage(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleTyping = (text: string) => {
    onTyping(text.length > 0);
  };

  const handleMessageReaction = (messageId: string, reactionType: string, emoji: string) => {
    onMessageReaction(messageId, reactionType, emoji);
  };

  const handleMessageEdit = (messageId: string, content: string) => {
    onMessageEdit(messageId, content);
  };

  const handleMessageDelete = (messageId: string) => {
    onMessageDelete(messageId);
  };

  const handleMessageReply = (message: IMessage) => {
    setReplyToMessage(message);
  };

  const handleMessageForward = (message: IMessage) => {
    // TODO: Implement forward functionality
    Alert.alert('Coming Soon', 'Forward message feature will be available soon');
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    return 'Several people are typing...';
  };

  const getOtherParticipant = () => {
    return conversation.participants.find(p => p._id !== currentUserId) || 
           { name: 'Unknown User', avatar: '' };
  };

  const renderMessage = ({ item: message }: { item: IMessage }) => (
    <MessageBubble
      message={message}
      isOwnMessage={message.sender._id === currentUserId}
      onReaction={handleMessageReaction}
      onEdit={handleMessageEdit}
      onDelete={handleMessageDelete}
      currentUser={currentUser}
      onReply={handleMessageReply}
      onForward={handleMessageForward}
    />
  );

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
              <View style={[styles.typingIndicator, { backgroundColor: theme.bgColor }]}>
        <View style={styles.typingDots}>
          <View style={[styles.typingDot, { backgroundColor: theme.fontColor + '60' }]} />
          <View style={[styles.typingDot, { backgroundColor: theme.fontColor + '60' }]} />
          <View style={[styles.typingDot, { backgroundColor: theme.fontColor + '60' }]} />
        </View>
        <Text style={[styles.typingText, { color: theme.fontColor + '80' }]}>
          {getTypingText()}
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles" size={64} color={theme.fontColor + '40'} />
      <Text style={[styles.emptyTitle, { color: theme.fontColor }]}>
        No messages yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.fontColor + '60' }]}>
        Start the conversation by sending a message
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
              <View style={[styles.header, { borderBottomColor: theme.bgColor }]}>
        <View style={styles.headerLeft}>
          {onToggleSidebar && (
            <TouchableOpacity style={styles.menuButton} onPress={onToggleSidebar}>
              <Ionicons name="menu" size={24} color={theme.fontColor} />
            </TouchableOpacity>
          )}
          
                            <TouchableOpacity style={styles.participantInfo} onPress={() => setShowInfo(true)}>
                    <View style={styles.avatarContainer}>
                      {getOtherParticipant().avatar ? (
                        <Image source={{ uri: getOtherParticipant().avatar }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.defaultAvatar, { backgroundColor: theme.bgColor }]}>
                          <Text style={[styles.defaultAvatarText, { color: theme.fontColor }]}>
                            {getOtherParticipant().name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {conversation.isOnline && <View style={styles.onlineIndicator} />}
                    </View>
            
            <View style={styles.participantDetails}>
              <Text style={[styles.participantName, { color: theme.fontColor }]}>
                {getOtherParticipant().name}
              </Text>
              <Text style={[styles.participantStatus, { color: theme.fontColor + '80' }]}>
                {conversation.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call" size={24} color={theme.fontColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="videocam" size={24} color={theme.fontColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowInfo(true)}>
            <Ionicons name="information-circle" size={24} color={theme.fontColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={messagesEndRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          isLoadingOlder ? (
            <View style={styles.loadingOlder}>
              <Text style={[styles.loadingText, { color: theme.fontColor }]}>
                Loading older messages...
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={renderTypingIndicator}
        ListEmptyComponent={renderEmptyState}
        inverted={false}
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        replyTo={replyToMessage ? {
          id: replyToMessage._id,
          preview: replyToMessage.content || 'Message'
        } : null}
        onCancelReply={handleCancelReply}
      />

      {/* Info Modal Placeholder */}
      {showInfo && (
        <View style={styles.infoModal}>
          <Text style={[styles.infoText, { color: theme.fontColor }]}>
            Conversation Info
          </Text>
          <TouchableOpacity onPress={() => setShowInfo(false)}>
            <Text style={[styles.closeText, { color: theme.fontColor }]}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  participantStatus: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  loadingOlder: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
    opacity: 0.6,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  infoModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 18,
    marginBottom: 16,
  },
  closeText: {
    fontSize: 16,
    color: '#0084FF',
  },
});

export default ChatInterface;
