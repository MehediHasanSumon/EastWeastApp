import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Contact, Group, Member, RootStackParamList } from '../types/types';
import api from '../utils/api';
import { useAppSelector } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Messages'>;

// Minimal copies of web app types to map server data
type IUser = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  presence?: { isOnline: boolean; lastSeen: string } | null;
};

type IMessage = {
  _id: string;
  sender: IUser;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'voice' | 'video';
  fileName?: string;
  createdAt: string;
};

type IConversation = {
  _id: string;
  participants: IUser[];
  type: 'direct' | 'group';
  name?: string;
  admins?: IUser[];
  lastMessage?: IMessage;
  lastMessageTime?: string;
  unreadCount?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
};

type ListItem =
  | (Contact & { isGroup?: false; conversationId: string })
  | ({
      id: string;
      name: string;
      avatarText: string;
      lastMessage: string;
      time: string;
      online: boolean;
      unread?: boolean;
      isGroup: true;
      members: Member[];
      conversationId: string;
    });

const MessagesScreen = ({ navigation }: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<IConversation[]>([]);

  const authUser = useAppSelector((s) => s.auth.user);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations().catch(() => {});
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: IConversation[] }>('/api/chat/conversations');
      const items = Array.isArray(res.data?.data) ? res.data.data : [];
      setConversations(items);
    } catch (error) {
      // Swallow to keep UI simple
    }
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchConversations();
    } finally {
      setRefreshing(false);
    }
  };

  const currentUser = useMemo(() => {
    const displayName = authUser?.name || authUser?.email || 'Me';
    const avatarText = displayName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return {
      id: (authUser as any)?._id || (authUser as any)?.id || 'me',
      name: displayName,
      avatarText,
    };
  }, [authUser]);

  // Map conversations to UI list items
  const combinedList: ListItem[] = useMemo(() => {
    const userId = currentUser.id;
    return conversations.map((conv) => {
      const lastMsgText = (() => {
        const m = conv.lastMessage;
        if (!m) return '';
        if (m.messageType === 'text') return m.content || '';
        if (m.messageType === 'image') return 'Photo';
        if (m.messageType === 'voice') return 'Voice message';
        if (m.messageType === 'video') return 'Video';
        return m.fileName ? `File · ${m.fileName}` : 'Attachment';
      })();

      const timeStr = new Date(conv.lastMessageTime || conv.updatedAt || conv.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const unread = Math.max(0, conv.unreadCount?.[userId] || 0) > 0;

      if (conv.type === 'group') {
        const members: Member[] = conv.participants.map((p) => ({
          id: p._id,
          name: p.name,
          avatar: p.avatar || '',
          status: p.presence?.isOnline ? 'online' : 'offline',
          lastSeen: p.presence?.lastSeen,
          role: (conv.admins || []).some((a) => a._id === p._id) ? 'Admin' : 'Member',
        }));
        return {
          id: conv._id,
          name: conv.name || 'Group',
          avatarText: (conv.name || 'G').charAt(0).toUpperCase(),
          lastMessage: lastMsgText,
          time: timeStr,
          online: members.some((m) => m.status === 'online'),
          unread,
          isGroup: true as const,
          members,
          conversationId: conv._id,
        };
      }

      // direct conversation
      const other = conv.participants.find((p) => p._id !== userId) || conv.participants[0];
      const name = other?.name || 'Unknown';
      const avatarText = (name || 'U')
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      return {
        id: other?._id || conv._id,
        name,
        avatarText,
        lastMessage: lastMsgText,
        time: timeStr,
        online: Boolean(other?.presence?.isOnline),
        unread,
        conversationId: conv._id,
      } as Contact & { conversationId: string };
    });
  }, [conversations, currentUser.id]);

  // Filter based on search query
  const filteredContacts = useMemo(
    () =>
      combinedList.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [combinedList, searchQuery]
  );

  // Handle contact/group press
  const handleContactPress = (contact: ListItem) => {
    if ((contact as any).isGroup) {
      const group: Group = {
        id: contact.id,
        name: contact.name,
        description: undefined,
        members: (contact as any).members,
        createdAt: new Date().toISOString(),
        isMuted: false,
      };
      navigation.navigate('GroupChat', { group });
    } else {
      navigation.navigate('Chat', {
        userId: currentUser.id,
        userName: currentUser.name,
        contactId: contact.id,
        contactName: contact.name,
      });
    }
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const renderContact = ({ item }: { item: ListItem }) => (
    <TouchableOpacity
      className="flex-row items-center gap-3 border-b border-gray-100 p-4"
      onPress={() => handleContactPress(item)}>
      <View className="relative h-12 w-12 items-center justify-center rounded-full bg-[#1877f2]">
        <Text className="text-base font-bold text-white">{item.avatarText}</Text>
        {!item.isGroup && item.online && (
          <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#31a24c]" />
        )}
        {item.isGroup && (
          <View className="absolute bottom-0 right-0 h-5 w-5 items-center justify-center rounded-full bg-[#1877f2]">
            <Ionicons name="people" size={16} color="white" />
          </View>
        )}
      </View>
      <View className="flex-1">
        <Text className="mb-1 text-base font-semibold text-[#050505]">{item.name}</Text>
        <Text className="text-sm text-[#65676b]">{item.lastMessage}</Text>
      </View>
      <View className="items-end">
        <Text className="mb-1 text-xs text-[#65676b]">{item.time}</Text>
        {item.unread && <View className="h-2.5 w-2.5 rounded-full bg-[#1877f2]" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar />
      <View className="w-full flex-1">
        <View className="flex-row items-center justify-between border-b border-gray-200 p-5">
          <TouchableOpacity
            className="flex-row items-center space-x-3"
            onPress={() => navigation.navigate('Profile')}>
              <View className="h-10 w-10 items-center justify-center space-x-2 rounded-full bg-[#1877f2]">
              <Text className="text-base font-bold text-white">{currentUser.avatarText}</Text>
            </View>
            <Text className="ml-3 text-base font-bold text-[#050505]">{currentUser.name}</Text>
          </TouchableOpacity>

          <View className="flex-row items-center space-x-5">
            <TouchableOpacity onPress={handleRefresh} className="mr-3">
              {refreshing ? (
                <ActivityIndicator size="small" />
              ) : (
                <Ionicons name="refresh-circle" size={24} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreateGroup}>
              <MaterialIcons name="group-add" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="border-b border-gray-200 p-2">
          <View className="flex-row items-center space-x-3 rounded-full bg-[#f0f2f5] px-4 py-2">
            <Ionicons name="search" size={20} />
            <TextInput
              className="flex-1 py-0 text-base"
              placeholder="Search Messenger"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#1877f2']}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default MessagesScreen;
