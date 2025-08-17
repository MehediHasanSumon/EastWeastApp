import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchConversations, setCurrentConversation } from '../store/chatSlice';
import { chatSocketService } from '../utils/chatSocket';
import { ChatConversation, ChatUser } from '../types/chat';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const ConversationListScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { theme } = useContext(ThemeContext);
  const { user } = useAppSelector((state) => state.auth);
  const { conversations, isLoading, isConnected } = useAppSelector((state) => state.chat);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
    setupSocketListeners();
  }, []);

  const setupSocketListeners = () => {
    // Listen for new messages
    chatSocketService.on('new_message', (message: any) => {
      // Refresh conversations to update last message
      loadConversations();
    });

    // Listen for connection status
    chatSocketService.on('socket_connected', () => {
      console.log('Socket connected');
    });

    chatSocketService.on('socket_disconnected', () => {
      console.log('Socket disconnected');
    });
  };

  const loadConversations = async () => {
    try {
      await dispatch(fetchConversations()).unwrap();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load conversations');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const getOtherParticipant = (conversation: ChatConversation): ChatUser | null => {
    if (conversation.type === 'direct') {
      return conversation.participants.find(p => p._id !== user?._id) || null;
    }
    return null;
  };

  const getConversationName = (conversation: ChatConversation): string => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    const otherUser = getOtherParticipant(conversation);
    return otherUser?.name || 'Unknown User';
  };

  const getConversationAvatar = (conversation: ChatConversation): string => {
    if (conversation.type === 'group') {
      return conversation.avatar || '';
    }
    const otherUser = getOtherParticipant(conversation);
    return otherUser?.avatar || '';
  };

  const getLastMessageText = (conversation: ChatConversation): string => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const { content, messageType } = conversation.lastMessage;
    switch (messageType) {
      case 'image':
        return '📷 Image';
      case 'file':
        return '📎 File';
      case 'voice':
        return '🎤 Voice message';
      case 'video':
        return '🎥 Video';
      default:
        return content || 'No messages yet';
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getUnreadCount = (conversation: ChatConversation): number => {
    if (!conversation.unreadCount || !user?._id) return 0;
    return conversation.unreadCount[user._id] || 0;
  };

  const handleConversationPress = (conversation: ChatConversation) => {
    dispatch(setCurrentConversation(conversation));
    navigation.navigate('ChatScreen' as never);
  };

  const renderConversationItem = ({ item }: { item: ChatConversation }) => {
    const otherUser = getOtherParticipant(item);
    const isOnline = otherUser?.presence?.status === 'online';
    const unreadCount = getUnreadCount(item);

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { backgroundColor: theme.bgColor }]}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={
              getConversationAvatar(item)
                ? { uri: getConversationAvatar(item) }
                : require('../assets/default-avatar.png')
            }
            style={styles.avatar}
          />
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.name, { color: theme.fontColor }]} numberOfLines={1}>
              {getConversationName(item)}
            </Text>
            <Text style={[styles.time, { color: theme.fontColor + '80' }]}>
              {item.lastMessageTime ? formatTime(item.lastMessageTime) : ''}
            </Text>
          </View>

          <View style={styles.messageRow}>
            <Text style={[styles.lastMessage, { color: theme.fontColor + 'CC' }]} numberOfLines={1}>
              {getLastMessageText(item)}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={theme.fontColor + '40'} />
      <Text style={[styles.emptyText, { color: theme.fontColor + '80' }]}>
        No conversations yet
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.fontColor + '60' }]}>
        Start a new conversation to begin messaging
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bgColor }]}className='mt-12'>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bgColor }]}>
        <Text style={[styles.headerTitle, { color: theme.fontColor }]}>Messages</Text>
        <View style={styles.headerActions}>
          <View style={[styles.connectionStatus, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]}>
            <View style={styles.connectionDot} />
            <Text style={styles.connectionText}>
              {isConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => navigation.navigate('NewConversationScreen' as never)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversation List */}
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item._id}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.fontColor}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.fontColor} />
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  newChatButton: {
    backgroundColor: '#6366F1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  time: {
    fontSize: 12,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ConversationListScreen;
