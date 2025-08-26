import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../context/CallContext';

const CallTestComponent: React.FC = () => {
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

  const [testConversationId] = useState('test-conversation-123');
  const [testRemoteUserId] = useState('test-remote-user-456');
  const [testRemoteUserName] = useState('Test User');

  const testAudioCall = async () => {
    try {
      console.log('Testing audio call...');
      await initiateCall(testConversationId, 'audio', testRemoteUserId, testRemoteUserName);
      Alert.alert('Success', 'Audio call test initiated!');
    } catch (error) {
      console.error('Audio call test failed:', error);
      Alert.alert('Error', `Audio call test failed: ${error}`);
    }
  };

  const testVideoCall = async () => {
    try {
      console.log('Testing video call...');
      await initiateCall(testConversationId, 'video', testRemoteUserId, testRemoteUserName);
      Alert.alert('Success', 'Video call test initiated!');
    } catch (error) {
      console.error('Video call test failed:', error);
      Alert.alert('Error', `Video call test failed: ${error}`);
    }
  };

  const testAcceptCall = async () => {
    try {
      console.log('Testing accept call...');
      await acceptIncomingCall();
      Alert.alert('Success', 'Call accepted!');
    } catch (error) {
      console.error('Accept call test failed:', error);
      Alert.alert('Error', `Accept call test failed: ${error}`);
    }
  };

  const testRejectCall = () => {
    console.log('Testing reject call...');
    rejectIncomingCall('test-rejection');
    Alert.alert('Call Rejected', 'Call has been rejected for testing');
  };

  const testEndCall = () => {
    console.log('Testing end call...');
    endCall();
    Alert.alert('Call Ended', 'Call has been ended for testing');
  };

  const testToggleMute = () => {
    console.log('Testing toggle mute...');
    toggleMute();
  };

  const testToggleVideo = () => {
    console.log('Testing toggle video...');
    toggleVideo();
  };

  const testSwitchCamera = () => {
    console.log('Testing switch camera...');
    switchCamera();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Call Functionality Test</Text>
      
      {/* Call Status Display */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Call Status</Text>
        {callState ? (
          <View style={styles.callStatus}>
            <Text style={styles.statusText}>
              Active Call: {callState.callType} call with {callState.remoteUserName}
            </Text>
            <Text style={styles.durationText}>
              Duration: {Math.floor(callState.duration / 60)}:{(callState.duration % 60).toString().padStart(2, '0')}
            </Text>
            <Text style={styles.statusText}>
              Muted: {callState.isMuted ? 'Yes' : 'No'} | Video: {callState.isVideoOff ? 'Off' : 'On'}
            </Text>
          </View>
        ) : (
          <Text style={styles.noCallText}>No active call</Text>
        )}
      </View>

      {/* Incoming Call Display */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Incoming Call</Text>
        {incomingCall ? (
          <View style={styles.incomingCallStatus}>
            <Text style={styles.statusText}>
              Incoming {incomingCall.callType} call from {incomingCall.fromUserId}
            </Text>
          </View>
        ) : (
          <Text style={styles.noCallText}>No incoming call</Text>
        )}
      </View>

      {/* Test Buttons */}
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Test Functions</Text>
        
        {/* Call Initiation Tests */}
        <View style={styles.buttonGroup}>
          <Text style={styles.buttonGroupTitle}>Call Initiation</Text>
          <TouchableOpacity style={[styles.testButton, styles.audioButton]} onPress={testAudioCall}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.buttonText}>Test Audio Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.testButton, styles.videoButton]} onPress={testVideoCall}>
            <Ionicons name="videocam" size={20} color="#fff" />
            <Text style={styles.buttonText}>Test Video Call</Text>
          </TouchableOpacity>
        </View>

        {/* Call Control Tests */}
        {callState && (
          <View style={styles.buttonGroup}>
            <Text style={styles.buttonGroupTitle}>Call Controls</Text>
            <TouchableOpacity style={[styles.testButton, styles.controlButton]} onPress={testToggleMute}>
              <Ionicons name="mic" size={20} color="#fff" />
              <Text style={styles.buttonText}>Toggle Mute</Text>
            </TouchableOpacity>
            
            {callState.callType === 'video' && (
              <>
                <TouchableOpacity style={[styles.testButton, styles.controlButton]} onPress={testToggleVideo}>
                  <Ionicons name="videocam" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Toggle Video</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.testButton, styles.controlButton]} onPress={testSwitchCamera}>
                  <Ionicons name="camera-reverse" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Switch Camera</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity style={[styles.testButton, styles.endCallButton]} onPress={testEndCall}>
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.buttonText}>End Call</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Incoming Call Tests */}
        {incomingCall && (
          <View style={styles.buttonGroup}>
            <Text style={styles.buttonGroupTitle}>Incoming Call Actions</Text>
            <TouchableOpacity style={[styles.testButton, styles.acceptButton]} onPress={testAcceptCall}>
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.buttonText}>Accept Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.testButton, styles.rejectButton]} onPress={testRejectCall}>
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.buttonText}>Reject Call</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>How to Test</Text>
        <Text style={styles.instructionText}>
          1. Press "Test Audio Call" or "Test Video Call" to initiate a call
        </Text>
        <Text style={styles.instructionText}>
          2. Check the console logs for detailed WebRTC initialization steps
        </Text>
        <Text style={styles.instructionText}>
          3. Use call controls when a call is active
        </Text>
        <Text style={styles.instructionText}>
          4. Monitor the call status display for real-time updates
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  callStatus: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  incomingCallStatus: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  noCallText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  testSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonGroup: {
    marginBottom: 20,
  },
  buttonGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#555',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 8,
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  audioButton: {
    backgroundColor: '#4CAF50',
  },
  videoButton: {
    backgroundColor: '#2196F3',
  },
  controlButton: {
    backgroundColor: '#FF9800',
  },
  endCallButton: {
    backgroundColor: '#F44336',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  instructionsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default CallTestComponent;
