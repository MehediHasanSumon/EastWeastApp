import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../context/CallContext';

interface CallExampleProps {
  conversationId: string;
  remoteUserId: string;
  remoteUserName: string;
}

const CallExample: React.FC<CallExampleProps> = ({
  conversationId,
  remoteUserId,
  remoteUserName,
}) => {
  const {
    callState,
    incomingCall,
    initiateCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  } = useCall();

  const handleStartAudioCall = async () => {
    try {
      await initiateCall(conversationId, 'audio', remoteUserId, remoteUserName);
      Alert.alert('Success', 'Audio call initiated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to start audio call');
    }
  };

  const handleStartVideoCall = async () => {
    try {
      await initiateCall(conversationId, 'video', remoteUserId, remoteUserName);
      Alert.alert('Success', 'Video call initiated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to start video call');
    }
  };

  const handleAcceptCall = async () => {
    try {
      await acceptIncomingCall();
      Alert.alert('Success', 'Call accepted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept call');
    }
  };

  const handleRejectCall = () => {
    rejectIncomingCall('declined');
    Alert.alert('Call Rejected', 'Call has been declined');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Call Example</Text>
      
      {/* Call Status */}
      {callState && (
        <View style={styles.callStatus}>
          <Text style={styles.statusText}>
            Active Call: {callState.callType} call with {callState.remoteUserName}
          </Text>
          <Text style={styles.durationText}>
            Duration: {Math.floor(callState.duration / 60)}:{(callState.duration % 60).toString().padStart(2, '0')}
          </Text>
          
          {/* Call Controls */}
          <View style={styles.callControls}>
            <TouchableOpacity
              style={[styles.controlButton, callState.isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
            >
              <Ionicons
                name={callState.isMuted ? 'mic-off' : 'mic'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            
            {callState.callType === 'video' && (
              <>
                <TouchableOpacity
                  style={[styles.controlButton, callState.isVideoOff && styles.controlButtonActive]}
                  onPress={toggleVideo}
                >
                  <Ionicons
                    name={callState.isVideoOff ? 'videocam-off' : 'videocam'}
                    size={24}
                    color="#fff"
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={switchCamera}
                >
                  <Ionicons name="camera-reverse" size={24} color="#fff" />
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity
              style={styles.endCallButton}
              onPress={endCall}
            >
              <Ionicons name="call" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Incoming Call */}
      {incomingCall && (
        <View style={styles.incomingCall}>
          <Text style={styles.incomingText}>
            Incoming {incomingCall.callType} call from {remoteUserName}
          </Text>
          <View style={styles.incomingActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAcceptCall}
            >
              <Ionicons name="call" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleRejectCall}
            >
              <Ionicons name="call" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Call Initiation */}
      {!callState && !incomingCall && (
        <View style={styles.callInitiation}>
          <Text style={styles.initiationText}>
            Start a call with {remoteUserName}
          </Text>
          <View style={styles.initiationButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.audioButton]}
              onPress={handleStartAudioCall}
            >
              <Ionicons name="call" size={24} color="#fff" />
              <Text style={styles.buttonText}>Audio Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.videoButton]}
              onPress={handleStartVideoCall}
            >
              <Ionicons name="videocam" size={24} color="#fff" />
              <Text style={styles.buttonText}>Video Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  callStatus: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  durationText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  endCallButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomingCall: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  incomingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  incomingActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  audioButton: {
    backgroundColor: '#4CAF50',
  },
  videoButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  callInitiation: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  initiationText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  initiationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

export default CallExample;
