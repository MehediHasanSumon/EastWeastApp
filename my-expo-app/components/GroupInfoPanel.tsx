import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Alert, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Group } from '../types/types';
import MemberItem from './MemberItem';

type GroupInfoPanelProps = {
  group: Group;
  toggleGroupInfo: () => void;
  toggleMuteNotifications: () => void;
};

const GroupInfoPanel = ({
  group,
  toggleGroupInfo,
  toggleMuteNotifications,
}: GroupInfoPanelProps) => {
  return (
    <View className="h-full w-[85vw] max-w-[360px] border-l border-gray-200 bg-white p-5 pt-10 shadow-xl">
      <TouchableOpacity
        className="absolute right-4 top-4 z-10 h-8 w-8 items-center justify-center rounded-full bg-gray-100 p-2"
        onPress={toggleGroupInfo}>
        <FontAwesome name="times" size={16} color="#666" />
      </TouchableOpacity>

      <Text className="mb-4 text-lg font-semibold text-gray-900">Group Info</Text>

      <View className="mb-6 rounded-lg bg-gray-100 p-4">
        <View className="mb-4 flex-row items-center">
          <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-blue-600">
            <FontAwesome name="users" size={24} color="white" />
          </View>
          <View>
            <Text className="text-base font-semibold text-gray-900">{group.name}</Text>
            <Text className="text-xs text-gray-500">{group.members.length} members</Text>
          </View>
        </View>
        <Text className="mb-3 text-sm leading-5 text-gray-600">{group.description}</Text>
        <Text className="text-xs italic text-gray-500">
          Created on {new Date(group.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View className="mb-6">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">
            Members ({group.members.length})
          </Text>
          <TouchableOpacity>
            <Text className="text-sm font-medium text-blue-600">Add</Text>
          </TouchableOpacity>
        </View>

        {group.members.map((member) => (
          <MemberItem
            key={member.id}
            member={{
              ...member,
              avatar: `https://placehold.co/36x36?text=${member.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}`,
              status: member.status,
            }}
          />
        ))}
      </View>

      <View className="gap-4">
        <Pressable
          className="flex-row items-center rounded-lg px-2.5 py-3 active:bg-gray-100"
          onPress={toggleMuteNotifications}>
          <FontAwesome name={group.isMuted ? 'bell-slash' : 'bell'} size={20} color="#666" />
          <Text className="ml-3 text-sm text-gray-900">
            {group.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
          </Text>
        </Pressable>

        <Pressable className="flex-row items-center rounded-lg px-2.5 py-3 active:bg-gray-100">
          <FontAwesome name="search" size={20} color="#666" />
          <Text className="ml-3 text-sm text-gray-900">Search in Conversation</Text>
        </Pressable>

        <Pressable className="flex-row items-center rounded-lg px-2.5 py-3 active:bg-gray-100">
          <FontAwesome name="cog" size={20} color="#666" />
          <Text className="ml-3 text-sm text-gray-900">Group Settings</Text>
        </Pressable>

        <Pressable
          className="flex-row items-center rounded-lg px-2.5 py-3 active:bg-gray-100"
          onPress={() => Alert.alert('Exit Group', 'Are you sure you want to exit this group?')}>
          <MaterialIcons name="exit-to-app" size={20} color="#ff4444" />
          <Text className="ml-3 text-sm text-red-500">Exit Group</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default GroupInfoPanel;
