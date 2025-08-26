import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { useContext } from 'react';
import { IConversation } from '../../types/chat';

interface ConversationListProps {
  conversations: IConversation[];
  currentConversationId?: string;
  onConversationSelect: (conversation: IConversation) => void;
  onNewConversation: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  isLoading = false,
  onRefresh,
  refreshing = false,
}) => {
  const { theme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const participantNames = conversation.participants
      .map((p: any) => p.name)
      .join(' ')
      .toLowerCase();
    
    return participantNames.includes(searchLower) ||
           conversation.lastMessage?.content?.toLowerCase().includes(searchLower);
  });

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (conversation: IConversation) => {
    // For now, just return the first participant that's not the current user
    // This should be updated based on your user context
    return conversation.participants[0] || { name: 'Unknown User', avatar: '' };
  };

  const renderConversation = ({ item: conversation }: { item: IConversation }) => {
    const isSelected = conversation._id === currentConversationId;
    const otherParticipant = getOtherParticipant(conversation);
    const unreadCount = conversation.unreadCount?.[conversation._id] || 0;

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          {
            backgroundColor: isSelected ? theme.bgColor + '20' : 'transparent',
            borderLeftColor: isSelected ? '#0084FF' : 'transparent',
          }
        ]}
        onPress={() => onConversationSelect(conversation)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {otherParticipant.avatar ? (
            <Image source={{ uri: otherParticipant.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.defaultAvatar, { backgroundColor: theme.bgColor }]}>
              <Text style={[styles.defaultAvatarText, { color: theme.fontColor }]}>
                {otherParticipant.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {conversation.isOnline && (
            <View style={styles.onlineIndicator} />
          )}
        </View>

        {/* Content */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[
              styles.participantName,
              { color: theme.fontColor },
              unreadCount > 0 && styles.unreadName
            ]} numberOfLines={1}>
              {otherParticipant.name}
            </Text>
            {conversation.lastMessage && (
              <Text style={[
                styles.lastMessageTime,
                { color: theme.fontColor + '60' }
              ]}>
                {formatTime(conversation.lastMessage.timestamp)}
              </Text>
            )}
          </View>

          <View style={styles.conversationFooter}>
            <Text style={[
              styles.lastMessage,
              { color: theme.fontColor + '80' },
              unreadCount > 0 && styles.unreadMessage
            ]} numberOfLines={1}>
              {conversation.lastMessage ? (
                conversation.lastMessage.messageType === 'image' ? '📷 Image' :
                conversation.lastMessage.messageType === 'file' ? '📎 File' :
                conversation.lastMessage.messageType === 'voice' ? '🎤 Voice Message' :
                conversation.lastMessage.content
              ) : 'No messages yet'
            }
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

        {/* Actions */}
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={theme.fontColor + '60'} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateText, { color: theme.fontColor }]}>
        {isLoading ? 'Loading conversations...' : 'No conversations yet'}
      </Text>
      {!isLoading && (
        <TouchableOpacity style={styles.newConversationButton} onPress={onNewConversation}>
          <Text style={styles.newConversationButtonText}>
            Start a new conversation
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0084FF" />
        <Text style={[styles.loadingText, { color: theme.fontColor }]}>
          Loading conversations...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
      {/* Header */}
              <View style={[styles.header, { borderBottomColor: theme.bgColor }]}>
        <Text style={[styles.headerTitle, { color: theme.fontColor }]}>
          Messages
        </Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={onNewConversation}
        >
          <Ionicons name="add" size={24} color="#0084FF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
              <View style={[styles.searchContainer, { borderBottomColor: theme.bgColor }]}>
                  <View style={[styles.searchInputContainer, { backgroundColor: theme.bgColor + '20' }]}>
          <Ionicons name="search" size={20} color={theme.fontColor + '60'} />
          <TextInput
            style={[styles.searchInput, { color: theme.fontColor }]}
            placeholder="Search conversations..."
            placeholderTextColor={theme.fontColor + '60'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.fontColor + '60'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0084FF']}
            tintColor="#0084FF"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  newButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContainer: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  defaultAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
    marginRight: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadName: {
    fontWeight: 'bold',
  },
  lastMessageTime: {
    fontSize: 12,
    marginLeft: 8,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#0084FF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  moreButton: {
    padding: 8,
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
    marginBottom: 24,
  },
  newConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  newConversationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default ConversationList;
