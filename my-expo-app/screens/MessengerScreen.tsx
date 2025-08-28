import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useContext, useState, useEffect } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { RootStackParamList } from '../types/types';
import api from '../utils/api';
import chatSocketService from '../utils/socketService';

type Props = NativeStackScreenProps<RootStackParamList, 'Messenger'>;

type Conversation = {
  _id: string;
  name?: string;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  lastMessageTime?: string;
  unreadCount?: { [userId: string]: number };
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    presence?: {
      isOnline: boolean;
    };
  }>;
  type: 'direct' | 'group';
};

type Message = {
  _id?: string;
  id?: string;
  content?: string;
  text?: string;
  createdAt?: string;
  time?: string;
  isOwn?: boolean;
  sender?: {
    _id: string;
    name: string;
  };
};

const MessengerScreen = ({ navigation }: Props) => {
  const { theme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState<'conversations' | 'chat'>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchConversations();
    getCurrentUser();
    initializeSocket();
    
    return () => {
      chatSocketService.setUserOffline();
      chatSocketService.disconnect();
    };
  }, []);

  const initializeSocket = async () => {
    await chatSocketService.connect();
    
    chatSocketService.on('new_message', (message: any) => {
      if (selectedConversation && message.conversationId === selectedConversation._id) {
        setMessages(prev => [...prev, message]);
      }
      fetchConversations();
    });

    chatSocketService.on('typing_start', (data: any) => {
      if (selectedConversation && data.conversationId === selectedConversation._id && data.userId !== currentUserId) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    });

    chatSocketService.on('typing_stop', (data: any) => {
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setTypingUsers(prev => prev.filter(userId => userId !== data.userId));
      }
    });

    chatSocketService.on('message_error', (error: any) => {
      console.error('Message error:', error);
    });

    chatSocketService.on('user_presence', (data: any) => {
      setConversations(prev => 
        prev.map(conv => ({
          ...conv,
          participants: conv.participants.map(p => 
            p._id === data.userId 
              ? { ...p, presence: { isOnline: data.isOnline } }
              : p
          )
        }))
      );
    });

    chatSocketService.on('socket_connected', () => {
      chatSocketService.setUserOnline();
    });
  };

  const getCurrentUser = async () => {
    try {
      const response = await api.get('/api/me');
      if (response.data.status) {
        setCurrentUserId(response.data.user._id || response.data.user.id);
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/chat/conversations');
      if (response.data.success) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
    return otherParticipant?.name || 'Unknown User';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return '👥';
    }
    return '👤';
  };

  const isOtherUserOnline = (conversation: Conversation) => {
    if (conversation.type !== 'direct') return false;
    const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
    return otherParticipant?.presence?.isOnline || false;
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
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

  const getUnreadCount = (conversation: Conversation) => {
    return conversation.unreadCount?.[currentUserId] || 0;
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/api/chat/conversations/${conversationId}/messages`);
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    
    const tempMessage = {
      _id: Date.now().toString(),
      content: messageText.trim(),
      sender: { _id: currentUserId, name: 'You' },
      createdAt: new Date().toISOString(),
      conversationId: selectedConversation._id,
      messageType: 'text'
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    chatSocketService.sendMessage({
      conversationId: selectedConversation._id,
      content: messageText.trim(),
      messageType: 'text'
    });
    
    setMessageText('');
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    chatSocketService.stopTyping(selectedConversation._id);
  };

  const handleTyping = (text: string) => {
    setMessageText(text);
    
    if (!selectedConversation) return;
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    if (text.length > 0) {
      chatSocketService.startTyping(selectedConversation._id);
      
      const timeout = setTimeout(() => {
        chatSocketService.stopTyping(selectedConversation._id);
      }, 2000);
      
      setTypingTimeout(timeout);
    } else {
      chatSocketService.stopTyping(selectedConversation._id);
    }
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    
    const typingUserNames = typingUsers
      .map(userId => {
        const user = selectedConversation?.participants.find(p => p._id === userId);
        return user?.name || 'Someone';
      })
      .filter(Boolean);
    
    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} is typing...`;
    } else if (typingUserNames.length === 2) {
      return `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  };



  const renderConversation = ({ item }: { item: Conversation }) => {
    const unreadCount = getUnreadCount(item);
    const isOnline = isOtherUserOnline(item);
    const conversationName = getConversationName(item);
    const avatar = getConversationAvatar(item);
    const lastMessageText = item.lastMessage?.content || 'No messages yet';
    const time = formatTime(item.lastMessageTime || item.lastMessage?.createdAt);

    return (
      <TouchableOpacity
        className="flex-row items-center p-4 border-b"
        style={{
          backgroundColor: theme.mode === 'dark' ? '#2a2a2a' : '#ffffff',
          borderBottomColor: theme.mode === 'dark' ? '#404040' : '#e5e5e5',
        }}
        onPress={() => {
          setSelectedConversation(item);
          setActiveTab('chat');
          fetchMessages(item._id);
          setTypingUsers([]);
        }}>
        <View className="relative mr-3">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{
              backgroundColor: theme.mode === 'dark' ? '#404040' : '#f0f0f0',
            }}>
            <Text className="text-xl">{avatar}</Text>
          </View>
          {isOnline && (
            <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1">
            <Text
              className="font-semibold"
              style={{ color: theme.fontColor, fontSize: theme.fontSize }}>
              {conversationName}
            </Text>
            <Text
              className="text-xs"
              style={{ color: theme.mode === 'dark' ? '#888' : '#666' }}>
              {time}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text
              className="flex-1"
              style={{
                color: theme.mode === 'dark' ? '#aaa' : '#666',
                fontSize: theme.fontSize - 2,
              }}
              numberOfLines={1}>
              {lastMessageText}
            </Text>
            {unreadCount > 0 && (
              <View className="ml-2 w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.sender?._id === currentUserId || item.isOwn;
    const messageTime = item.createdAt ? formatTime(item.createdAt) : item.time;
    
    return (
      <View
        className={`mb-3 ${isOwn ? 'items-end' : 'items-start'}`}
        style={{ paddingHorizontal: 16 }}>
        <View
          className={`max-w-[80%] p-3 rounded-2xl`}
          style={{
            backgroundColor: isOwn
              ? '#3b82f6'
              : theme.mode === 'dark'
              ? '#2a2a2a'
              : '#f0f0f0',
          }}>
          <Text
            style={{
              color: isOwn ? '#ffffff' : theme.fontColor,
              fontSize: theme.fontSize,
            }}>
            {item.content || item.text}
          </Text>
          <Text
            className="text-xs mt-1"
            style={{
              color: isOwn
                ? 'rgba(255,255,255,0.7)'
                : theme.mode === 'dark'
                ? '#888'
                : '#666',
            }}>
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const name = getConversationName(conv).toLowerCase();
    const lastMessage = conv.lastMessage?.content?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase()) || lastMessage.includes(searchQuery.toLowerCase());
  });

  const ConversationsList = () => (
    <View className="flex-1" style={{ backgroundColor: theme.bgColor }}>
      <View
        className="p-4 border-b"
        style={{
          backgroundColor: theme.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
          borderBottomColor: theme.mode === 'dark' ? '#404040' : '#e5e5e5',
        }}>
        <Text
          className="text-xl font-bold mb-3"
          style={{ color: theme.fontColor }}>
          Messages
        </Text>
        <TextInput
          className="p-3 rounded-lg border"
          style={{
            backgroundColor: theme.mode === 'dark' ? '#2a2a2a' : '#ffffff',
            borderColor: theme.mode === 'dark' ? '#404040' : '#e5e5e5',
            color: theme.fontColor,
          }}
          placeholder="Search conversations..."
          placeholderTextColor={theme.mode === 'dark' ? '#888' : '#666'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text
            className="mt-2"
            style={{ color: theme.fontColor }}>
            Loading conversations...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item._id}
          style={{ backgroundColor: theme.bgColor }}
          refreshing={loading}
          onRefresh={fetchConversations}
        />
      )}
    </View>
  );

  const ChatInterface = () => (
    <View className="flex-1" style={{ backgroundColor: theme.bgColor }}>
      <View
        className="flex-row items-center p-4 border-b"
        style={{
          backgroundColor: theme.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
          borderBottomColor: theme.mode === 'dark' ? '#404040' : '#e5e5e5',
        }}>
        <TouchableOpacity
          className="mr-3 p-2"
          onPress={() => setActiveTab('conversations')}>
          <Text style={{ color: theme.fontColor, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View className="flex-row items-center flex-1">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{
              backgroundColor: theme.mode === 'dark' ? '#404040' : '#f0f0f0',
            }}>
            <Text>{selectedConversation ? getConversationAvatar(selectedConversation) : '👤'}</Text>
          </View>
          <View>
            <Text
              className="font-semibold"
              style={{ color: theme.fontColor, fontSize: theme.fontSize }}>
              {selectedConversation ? getConversationName(selectedConversation) : 'Unknown'}
            </Text>
            <Text
              className="text-xs"
              style={{ color: theme.mode === 'dark' ? '#888' : '#666' }}>
              {selectedConversation ? (isOtherUserOnline(selectedConversation) ? 'Online' : 'Offline') : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
      
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id || item.id}
        className="flex-1 pt-4"
        style={{ backgroundColor: theme.bgColor }}
      />
      
      {typingUsers.length > 0 && (
        <View className="px-4 py-2 flex-row items-center">
          <View className="flex-row mr-2">
            <View className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1" />
            <View className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1" />
            <View className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          </View>
          <Text
            className="text-sm italic"
            style={{ color: theme.mode === 'dark' ? '#888' : '#666' }}>
            {getTypingText()}
          </Text>
        </View>
      )}
      
      <View
        className="flex-row items-center p-4 border-t"
        style={{
          backgroundColor: theme.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
          borderTopColor: theme.mode === 'dark' ? '#404040' : '#e5e5e5',
        }}>
        <TextInput
          className="flex-1 p-3 mr-3 rounded-full border"
          style={{
            backgroundColor: theme.mode === 'dark' ? '#2a2a2a' : '#ffffff',
            borderColor: theme.mode === 'dark' ? '#404040' : '#e5e5e5',
            color: theme.fontColor,
          }}
          placeholder="Type a message..."
          placeholderTextColor={theme.mode === 'dark' ? '#888' : '#666'}
          value={messageText}
          onChangeText={handleTyping}
          multiline
        />
        <TouchableOpacity
          className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center"
          onPress={sendMessage}>
          <Text className="text-white font-bold">→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return activeTab === 'conversations' ? <ConversationsList /> : <ChatInterface />;
};

export default MessengerScreen;