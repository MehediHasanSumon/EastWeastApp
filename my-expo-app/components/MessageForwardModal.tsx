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
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';
import { ChatConversation, ChatMessage } from '../types/chat';
import { chatSocketService } from '../utils/chatSocket';

interface MessageForwardModalProps {
  visible: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  conversations: ChatConversation[];
}

const MessageForwardModal: React.FC<MessageForwardModalProps> = ({
  visible,
  onClose,
  message,
  conversations,
}) => {
  const { theme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<ChatConversation[]>([]);
  const [forwarding, setForwarding] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  useEffect(() => {
    if (visible && message) {
      // Filter out the current conversation and group conversations
      const filtered = conversations.filter(conv => 
        conv.type === 'direct' && 
        conv._id !== message.conversationId
      );
      setFilteredConversations(filtered);
    }
  }, [visible, message, conversations]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter(conv =>
        conv.type === 'direct' &&
        conv._id !== message?.conversationId &&
        conv.participants.some(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredConversations(filtered);
    } else {
      const filtered = conversations.filter(conv => 
        conv.type === 'direct' && 
        conv._id !== message?.conversationId
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations, message]);

  const handleForward = async (conversationId: string) => {
    if (!message) return;

    try {
      setForwarding(true);
      setSelectedConversation(conversationId);

      // Prepare message data for forwarding
      const forwardData = {
        conversationId,
        content: message.content,
        messageType: message.messageType,
        mediaUrl: message.mediaUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        duration: message.duration,
        replyTo: undefined, // Remove reply when forwarding
      };

      const result = await chatSocketService.sendMessage(forwardData);
      
      if (result.success) {
        Alert.alert('Success', 'Message forwarded successfully!');
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to forward message');
      }
    } catch (error) {
      console.error('Error forwarding message:', error);
      Alert.alert('Error', 'Failed to forward message');
    } finally {
      setForwarding(false);
      setSelectedConversation(null);
    }
  };

  const renderConversation = ({ item }: { item: ChatConversation }) => {
    const isSelected = selectedConversation === item._id;
    const isForwarding = forwarding && isSelected;
    
    // Get the other participant's name (not the current user)
    const otherParticipant = item.participants.find(p => p._id !== message?.sender._id);
    const displayName = otherParticipant?.name || 'Unknown User';

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' },
          isSelected && { borderColor: '#0084FF', borderWidth: 2 }
        ]}
        onPress={() => handleForward(item._id)}
        disabled={forwarding}
      >
        <View style={styles.conversationInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.conversationDetails}>
            <Text style={[styles.conversationName, { color: theme.fontColor }]}>
              {displayName}
            </Text>
            <Text style={[styles.conversationType, { color: theme.fontColor + '99' }]}>
              Direct Message
            </Text>
          </View>
        </View>
        
        {isForwarding && (
          <ActivityIndicator size="small" color="#0084FF" />
        )}
        
        {!isForwarding && (
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color={theme.fontColor + '66'} 
          />
        )}
      </TouchableOpacity>
    );
  };

  if (!message) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.mode === 'dark' ? '#242526' : '#FFFFFF' }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.fontColor} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.fontColor }]}>Forward Message</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Message Preview */}
          <View style={[styles.messagePreview, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
            <Text style={[styles.previewLabel, { color: theme.fontColor + '99' }]}>
              Message to forward:
            </Text>
            <View style={styles.previewContent}>
              {message.messageType === 'image' && message.mediaUrl && (
                <Image
                  source={{ uri: message.mediaUrl }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              )}
              <Text style={[styles.previewText, { color: theme.fontColor }]} numberOfLines={2}>
                {message.content || `📎 ${message.messageType} message`}
              </Text>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.fontColor + '66'} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { 
                color: theme.fontColor,
                backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5'
              }]}
              placeholder="Search conversations..."
              placeholderTextColor={theme.fontColor + '66'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Conversations List */}
          <FlatList
            data={filteredConversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item._id}
            style={styles.conversationsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people" size={48} color={theme.fontColor + '33'} />
                <Text style={[styles.emptyText, { color: theme.fontColor + '66' }]}>
                  No conversations found
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  messagePreview: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  previewText: {
    fontSize: 14,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 44,
    fontSize: 16,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  conversationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  conversationDetails: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  conversationType: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});

export default MessageForwardModal;
