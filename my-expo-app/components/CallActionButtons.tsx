import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../context/CallContext';
import { CallType } from '../types/chat';

interface CallActionButtonsProps {
  conversationId: string;
  remoteUserId: string;
  remoteUserName: string;
  disabled?: boolean;
}

const CallActionButtons: React.FC<CallActionButtonsProps> = ({
  conversationId,
  remoteUserId,
  remoteUserName,
  disabled = false,
}) => {
  const { initiateCall, callState } = useCall();

  const handleCallPress = (callType: CallType) => {
    if (disabled) return;
    
    if (callState) {
      Alert.alert('Call in Progress', 'You already have an active call. Please end it first.');
      return;
    }

    Alert.alert(
      `Start ${callType === 'video' ? 'Video' : 'Audio'} Call`,
      `Call ${remoteUserName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Call',
          onPress: () => startCall(callType),
        },
      ]
    );
  };

  const startCall = async (callType: CallType) => {
    try {
      await initiateCall(conversationId, callType, remoteUserId, remoteUserName);
    } catch (error) {
      console.error('Failed to start call:', error);
      Alert.alert('Error', 'Failed to start call. Please try again.');
    }
  };

  const isCallActive = callState?.conversationId === conversationId;

  return (
    <View style={styles.container}>
      {/* Audio Call Button */}
      <TouchableOpacity
        style={[
          styles.callButton,
          styles.audioCallButton,
          (disabled || isCallActive) && styles.disabledButton
        ]}
        onPress={() => handleCallPress('audio')}
        disabled={disabled || isCallActive}
      >
        <Ionicons
          name="call"
          size={20}
          color={disabled || isCallActive ? '#999' : '#4CAF50'}
        />
      </TouchableOpacity>

      {/* Video Call Button */}
      <TouchableOpacity
        style={[
          styles.callButton,
          styles.videoCallButton,
          (disabled || isCallActive) && styles.disabledButton
        ]}
        onPress={() => handleCallPress('video')}
        disabled={disabled || isCallActive}
      >
        <Ionicons
          name="videocam"
          size={20}
          color={disabled || isCallActive ? '#999' : '#2196F3'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  audioCallButton: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  videoCallButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  disabledButton: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
});

export default CallActionButtons;
