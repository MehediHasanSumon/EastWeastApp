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
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchConversations, setCurrentConversation } from '../store/chatSlice';
import { chatSocketService } from '../utils/chatSocket';
import { ChatConversation, ChatUser } from '../types/chat';
import { ThemeContext } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ConversationListScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { theme } = useContext(ThemeContext);
  const { user } = useAppSelector((state) => state.auth);
  const { conversations, isLoading, isConnected } = useAppSelector((state) => state.chat);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
    setupSocketListeners();
  }, []);

  const setupSocketListeners = () => {
    chatSocketService.on('new_message', () => loadConversations());
    chatSocketService.on('socket_connected', () => console.log('Socket connected'));
    chatSocketService.on('socket_disconnected', () => console.log('Socket disconnected'));
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

  // ✅ Utility functions
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

  const getConversationAvatar = (conversation: ChatConversation) => {
    if (conversation.type === 'group') {
      return { 
        isGroup: true,
        user: {
          name: conversation.name || 'Group Chat',
          avatar: conversation.avatar
        }
      };
    }
    const otherUser = getOtherParticipant(conversation);
    return { user: otherUser || { name: 'Unknown User' }, isGroup: false };
  };

  const getLastMessageText = (conversation: ChatConversation): string => {
    if (!conversation.lastMessage) return 'No messages yet';
    const { content, messageType } = conversation.lastMessage;
    switch (messageType) {
      case 'image': return '📷 Image';
      case 'file': return '📎 File';
      case 'voice': return '🎤 Voice message';
      case 'video': return '🎥 Video';
      default: return content || 'No messages yet';
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getUnreadCount = (conversation: ChatConversation): number => {
    if (!conversation.unreadCount || !user?._id) return 0;
    return conversation.unreadCount[user._id] || 0;
  };

  const handleConversationPress = (conversation: ChatConversation) => {
    dispatch(setCurrentConversation(conversation));
    navigation.navigate('ChatScreen' as never);
  };

  // ✅ Filtered conversations based on search
  const filteredConversations = conversations.filter(c =>
    getConversationName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Avatar
            {...getConversationAvatar(item)}
            size={50}
            showOnlineIndicator={true}
            isOnline={isOnline}
          />
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
              <View style={[styles.unreadBadge, { backgroundColor: theme.bgColor || '#6366F1' }]}>
                <Text style={styles.unreadCount}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.fontColor + '15' }]}>
        <Ionicons name="chatbubbles-outline" size={64} color={theme.bgColor || '#6366F1'} />
      </View>
      <Text style={[styles.emptyText, { color: theme.fontColor }]}>No conversations yet</Text>
      <Text style={[styles.emptySubtext, { color: theme.fontColor + '80' }]}>
        Start a new conversation to begin messaging
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
      {/* Header with gradient */}
      <LinearGradient
        colors={theme.primaryGradient || ['#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerActions}>
            <View
              style={[
                styles.connectionStatus,
                { backgroundColor: isConnected ? 'rgba(255,255,255,0.3)' : 'rgba(239,68,68,0.3)' },
              ]}
            >
              <View
                style={[styles.connectionDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]}
              />
              <Text style={styles.connectionText}>{isConnected ? 'Online' : 'Offline'}</Text>
            </View>
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={() => navigation.navigate('NewConversationScreen' as never)}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Search Box */}
      <View style={[styles.searchContainer, { backgroundColor: theme.mode }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.fontColor + '10' }]}>
          <Ionicons name="search" size={20} color={theme.fontColor + '80'} style={styles.searchIcon} />
          <TextInput
            placeholder="Search conversations"
            placeholderTextColor={theme.fontColor + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.fontColor }]}
          />
        </View>
      </View>

      {/* Conversation List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item._id}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.bgColor || '#6366F1']}
            tintColor={theme.bgColor || '#6366F1'}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={conversations.length === 0 ? { flex: 1 } : undefined}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.bgColor || '#6366F1'} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  connectionStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 12 },
  connectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  connectionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  newChatButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 1 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  list: { flex: 1 },
  conversationItem: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F620' },
  avatarContainer: { position: 'relative', marginRight: 15 },

  contentContainer: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { fontSize: 17, fontWeight: '700', flex: 1 },
  time: { fontSize: 13, fontWeight: '500' },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 15, flex: 1, fontWeight: '400' },
  unreadBadge: { borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  unreadCount: { color: '#fff', fontSize: 12, fontWeight: '700', paddingHorizontal: 6 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: -100 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  emptySubtext: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.2)', justifyContent: 'center', alignItems: 'center' },
});

export default ConversationListScreen;
