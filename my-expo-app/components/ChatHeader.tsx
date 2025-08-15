// File: components/ChatHeader.tsx
import { Entypo, FontAwesome } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BackButton from './BackButton';

type Props = {
  groupName: string;
  memberCount: number;
  onBack: () => void;
  onToggleInfo: () => void;
  onAudioCall: () => void;
  onVideoCall: () => void;
  onGroupOptions: () => void;
};

const ChatHeader = ({
  groupName,
  memberCount,
  onBack,
  onToggleInfo,
  onAudioCall,
  onVideoCall,
  onGroupOptions,
}: Props) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <BackButton />
        <TouchableOpacity onPress={onToggleInfo}>
          <View style={styles.groupAvatarContainer}>
            <View style={styles.groupAvatar}>
              <FontAwesome name="users" size={20} color="white" />
            </View>
            <View style={styles.onlineIndicatorHeader} />
          </View>
        </TouchableOpacity>
        <View>
          <Text style={styles.groupName}>{groupName}</Text>
          <Text style={styles.groupMembers}>{memberCount} members</Text>
        </View>
      </View>
      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.iconButton} onPress={onAudioCall}>
          <FontAwesome name="phone" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onVideoCall}>
          <FontAwesome name="video-camera" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={onGroupOptions}>
          <Entypo name="dots-three-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
  },
  groupAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicatorHeader: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#31a24c',
    borderWidth: 2,
    borderColor: 'white',
  },
  groupName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#050505',
  },
  groupMembers: {
    fontSize: 13,
    color: '#65676b',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 8,
  },
});

export default ChatHeader;
