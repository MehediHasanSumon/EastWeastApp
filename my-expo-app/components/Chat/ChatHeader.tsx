import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useThemeReady } from '../../context/ThemeContext';
import { ChatConversation, ChatUser } from '../../types/chat';
import Avatar from '../Avatar';

interface ChatHeaderProps {
  conversation: ChatConversation;
  currentUser: ChatUser | null;
  onShowUserInfo: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  currentUser,
  onShowUserInfo,
}) => {
  const navigation = useNavigation();
  const isThemeReady = useThemeReady();
  
  // Don't render until theme is ready
  if (!isThemeReady) {
    return null;
  }
  
  const { theme } = useTheme();

  const getConversationName = () => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    const otherParticipant = conversation.participants.find(p => p._id !== currentUser?._id);
    return otherParticipant?.name || 'Unknown User';
  };

  const getConversationSubtitle = () => {
    if (conversation.type === 'group') {
      return `${conversation.participants.length} members`;
    }
    return 'Active now';
  };

  const getConversationAvatar = () => {
    if (conversation.type === 'group') {
      return { 
        isGroup: true,
        user: {
          name: conversation.name || 'Group Chat',
          avatar: conversation.avatar
        }
      };
    }
    const otherParticipant = conversation.participants.find(p => p._id !== currentUser?._id);
    return {
      user: otherParticipant,
      isGroup: false
    };
  };

  return (
    <LinearGradient
      colors={theme.mode === 'dark' ? ['#1A1A1A', '#242526'] : ['#FFFFFF', '#F8F9FA']}
      style={styles.header}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <View style={[styles.iconContainer, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
          <Ionicons name="arrow-back" size={20} color={theme.fontColor} />
        </View>
      </TouchableOpacity>
      
              <TouchableOpacity style={styles.headerInfo} activeOpacity={0.8}>
          <View style={styles.avatarWrapper}>
            <Avatar
              {...getConversationAvatar()}
              size={40}
              showOnlineIndicator={true}
              isOnline={true}
            />
            <View style={styles.avatarBadge} />
          </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: theme.fontColor }]} numberOfLines={1}>
            {getConversationName()}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.fontColor + '99' }]} numberOfLines={1}>
            {getConversationSubtitle()}
          </Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.headerActions}>
        <TouchableOpacity style={[styles.headerActionButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
          <Ionicons name="call" size={18} color="#0084FF" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.headerActionButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
          <Ionicons name="videocam" size={18} color="#0084FF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.headerActionButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}
          onPress={onShowUserInfo}
        >
          <Ionicons name="information-circle" size={18} color="#0084FF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderBottomWidth: 0,
  },
  backButton: {
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },

  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatHeader;
