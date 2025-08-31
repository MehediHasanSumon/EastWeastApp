import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeReady } from '../context/ThemeContext';
import { ChatConversation, ChatMessage } from '../types/chat';
import Avatar from './Avatar';

const { width, height } = Dimensions.get('window');

interface ForwardModalProps {
  visible: boolean;
  message: ChatMessage | null;
  conversations: ChatConversation[];
  onForward: (conversationId: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ForwardModal: React.FC<ForwardModalProps> = ({
  visible,
  message,
  conversations,
  onForward,
  onCancel,
  isLoading = false,
}) => {
  const isThemeReady = useThemeReady();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<ChatConversation[]>([]);

  // Don't render until theme is ready
  if (!isThemeReady) {
    return null;
  }

  const { theme } = useTheme();

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter(conv => 
        conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.participants.some(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const renderConversationItem = ({ item }: { item: ChatConversation }) => {
    const isGroup = item.type === 'group';
    const displayName = isGroup ? item.name : item.participants.find(p => p._id !== message?.sender._id)?.name || 'Unknown';
    const avatarProps = isGroup 
      ? { isGroup: true, user: { name: displayName } }
      : { user: item.participants.find(p => p._id !== message?.sender._id) || { name: 'Unknown' }, isGroup: false };

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          { backgroundColor: theme.mode === 'dark' ? '#2A2A2A' : '#FFFFFF' }
        ]}
        onPress={() => onForward(item._id)}
        activeOpacity={0.7}
      >
        <Avatar
          {...avatarProps}
          size={48}
          showOnlineIndicator={false}
        />
        <View style={styles.conversationInfo}>
          <Text style={[styles.conversationName, { color: theme.fontColor }]}>
            {displayName}
          </Text>
          <Text style={[styles.conversationType, { color: theme.fontColor + '99' }]}>
            {isGroup ? `${item.participants.length} members` : 'Direct message'}
          </Text>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={theme.fontColor + '66'} 
        />
      </TouchableOpacity>
    );
  };

  const renderMessagePreview = () => {
    if (!message) return null;

    return (
      <View style={[
        styles.messagePreview,
        { backgroundColor: theme.mode === 'dark' ? '#2A2A2A' : '#F0F2F5' }
      ]}>
        <View style={styles.messagePreviewHeader}>
          <Text style={[styles.previewTitle, { color: theme.fontColor }]}>
            Forward Message
          </Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.fontColor + '66'} />
          </TouchableOpacity>
        </View>
        
                 <View style={styles.messageContent}>
           <Avatar
             user={{ name: message.sender.name, avatar: message.sender.avatar }}
             size={32}
             showOnlineIndicator={false}
           />
          <View style={styles.messageTextContainer}>
            <Text style={[styles.senderName, { color: theme.fontColor + 'CC' }]}>
              {message.sender.name}
            </Text>
            <Text style={[styles.messageText, { color: theme.fontColor + '99' }]} numberOfLines={2}>
              {message.isDeleted ? 'This message was deleted' : message.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
        {/* Header */}
        <View style={[
          styles.header,
          { borderBottomColor: theme.mode === 'dark' ? '#3A3B3C' : '#E4E6EB' }
        ]}>
          <Text style={[styles.headerTitle, { color: theme.fontColor }]}>
            Forward to...
          </Text>
        </View>

        {/* Message Preview */}
        {renderMessagePreview()}

        {/* Search Bar */}
        <View style={[
          styles.searchContainer,
          { backgroundColor: theme.mode === 'dark' ? '#2A2A2A' : '#F0F2F5' }
        ]}>
          <Ionicons name="search" size={20} color={theme.fontColor + '66'} />
          <TextInput
            style={[styles.searchInput, { color: theme.fontColor }]}
            placeholder="Search conversations..."
            placeholderTextColor={theme.fontColor + '66'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Conversations List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0084FF" />
            <Text style={[styles.loadingText, { color: theme.fontColor + '99' }]}>
              Loading conversations...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={theme.fontColor + '66'} />
                <Text style={[styles.emptyText, { color: theme.fontColor + '99' }]}>
                  {searchQuery ? 'No conversations found' : 'No conversations available'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  messagePreview: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  messagePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 16,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  conversationType: {
    fontSize: 14,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ForwardModal;
