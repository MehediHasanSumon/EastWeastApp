// MemberItem.tsx
import { Entypo, FontAwesome } from '@expo/vector-icons';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import { Member } from '../types/types';

type MemberItemProps = {
  member: Member;
};

const MemberItem = ({ member }: MemberItemProps) => {
  return (
    <View className="flex-row items-center py-2">
      <View className="relative mr-3">
        <Image source={{ uri: member.avatar }} className="h-9 w-9 rounded-full" />
        <View
          className={`
            absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white
            ${member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}
          `}
        />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-900">{member.name}</Text>
        <Text className="text-xs text-gray-500">
          {member.status === 'online' ? 'Online' : member.lastSeen || 'Offline'}
          {member.role && ` • ${member.role}`}
        </Text>
      </View>
      <View className="flex-row items-center">
        <TouchableOpacity
          className="p-2"
          onPress={() => Alert.alert('Call', `Calling ${member.name}`)}>
          <FontAwesome name="phone" size={16} color="#1877f2" />
        </TouchableOpacity>
        <TouchableOpacity className="p-2">
          <Entypo name="dots-three-vertical" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MemberItem;
