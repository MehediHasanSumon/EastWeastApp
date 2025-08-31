import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';
import Avatar from './Avatar';

const { width, height } = Dimensions.get('window');

interface User {
  _id: string;
  name?: string;
  email?: string;
  avatar?: string;
  status?: string;
  lastSeen?: string;
}

interface Conversation {
  _id: string;
  name?: string;
  type: 'direct' | 'group';
  participants: User[];
  createdAt: string;
  avatar?: string;
}

interface UserInfoModalProps {
  visible: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  currentUser: User | null;
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({
  visible,
  onClose,
  conversation,
  currentUser,
}) => {
  const { theme } = useContext(ThemeContext);

  if (!conversation || !currentUser) return null;

  const otherUser = conversation.type === 'direct' 
    ? conversation.participants.find(p => p._id !== currentUser._id)
    : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return formatDate(dateString);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.mode === 'dark' ? '#242526' : '#FFFFFF' }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.fontColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.fontColor }]}>
            {conversation.type === 'direct' ? 'User Info' : 'Group Info'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <Avatar
              user={conversation.type === 'direct' ? (otherUser || { name: 'Unknown User' }) : {
                name: conversation.name || 'Group Chat',
                avatar: conversation.type === 'group' ? conversation.avatar : undefined
              }}
              isGroup={conversation.type === 'group'}
              size={80}
              showOnlineIndicator={false}
            />
            
            <Text style={[styles.profileName, { color: theme.fontColor }]}>
              {conversation.type === 'direct' 
                ? otherUser?.name || 'Unknown User'
                : conversation.name || 'Group Chat'
              }
            </Text>
            
            {conversation.type === 'direct' && otherUser?.status && (
              <Text style={[styles.userStatus, { color: theme.fontColor + 'CC' }]}>
                {otherUser.status}
              </Text>
            )}
            
            {conversation.type === 'direct' && otherUser?.lastSeen && (
              <Text style={[styles.lastSeen, { color: theme.fontColor + '99' }]}>
                Last seen {formatLastSeen(otherUser.lastSeen)}
              </Text>
            )}
          </View>

          {/* Info Sections */}
          {conversation.type === 'direct' && otherUser && (
            <>
              {/* Contact Info */}
              <View style={[styles.infoSection, { borderBottomColor: theme.mode === 'dark' ? '#3A3B3C' : '#E4E6EB' }]}>
                <Text style={[styles.sectionTitle, { color: theme.fontColor }]}>Contact Info</Text>
                
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color={theme.fontColor + 'CC'} />
                  <Text style={[styles.infoText, { color: theme.fontColor }]}>
                    {otherUser.email || 'No email available'}
                  </Text>
                </View>
              </View>

              {/* Chat Info */}
              <View style={[styles.infoSection, { borderBottomColor: theme.mode === 'dark' ? '#3A3B3C' : '#E4E6EB' }]}>
                <Text style={[styles.sectionTitle, { color: theme.fontColor }]}>Chat Info</Text>
                
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color={theme.fontColor + 'CC'} />
                  <Text style={[styles.infoText, { color: theme.fontColor }]}>
                    Started {formatDate(conversation.createdAt)}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Group Info */}
          {conversation.type === 'group' && (
            <>
              <View style={[styles.infoSection, { borderBottomColor: theme.mode === 'dark' ? '#3A3B3C' : '#E4E6EB' }]}>
                <Text style={[styles.sectionTitle, { color: theme.fontColor }]}>Group Info</Text>
                
                <View style={styles.infoRow}>
                  <Ionicons name="people-outline" size={20} color={theme.fontColor + 'CC'} />
                  <Text style={[styles.infoText, { color: theme.fontColor }]}>
                    {conversation.participants.length} members
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color={theme.fontColor + 'CC'} />
                  <Text style={[styles.infoText, { color: theme.fontColor }]}>
                    Created {formatDate(conversation.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Members List */}
              <View style={[styles.infoSection, { borderBottomColor: theme.mode === 'dark' ? '#3A3B3C' : '#E4E6EB' }]}>
                <Text style={[styles.sectionTitle, { color: theme.fontColor }]}>Members</Text>
                
                {conversation.participants.map((participant) => (
                  <View key={participant._id} style={styles.memberRow}>
                    <Avatar
                      user={participant}
                      size={40}
                      showOnlineIndicator={false}
                    />
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, { color: theme.fontColor }]}>
                        {participant.name || 'Unknown User'}
                      </Text>
                      <Text style={[styles.memberEmail, { color: theme.fontColor + '99' }]}>
                        {participant.email || 'No email available'}
                      </Text>
                    </View>
                    {participant._id === currentUser._id && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youText}>You</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
              <Ionicons name="call-outline" size={20} color={theme.fontColor} />
              <Text style={[styles.actionText, { color: theme.fontColor }]}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
              <Ionicons name="videocam-outline" size={20} color={theme.fontColor} />
              <Text style={[styles.actionText, { color: theme.fontColor }]}>Video Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
              <Ionicons name="search-outline" size={20} color={theme.fontColor} />
              <Text style={[styles.actionText, { color: theme.fontColor }]}>Search</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E6EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },

  profileName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  userStatus: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  lastSeen: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
  },
  youBadge: {
    backgroundColor: '#0084FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  youText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default UserInfoModal;
