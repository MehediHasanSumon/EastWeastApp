import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../context/CallContext';
import { webrtcService } from '../utils/webrtcService';

const { width, height } = Dimensions.get('window');

const ActiveCallScreen: React.FC = () => {
  const {
    callState,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  } = useCall();

  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);

  useEffect(() => {
    if (callState) {
      // Get streams from WebRTC service
      const local = webrtcService.getLocalStream();
      const remote = webrtcService.getRemoteStream();
      
      setLocalStream(local);
      setRemoteStream(remote);
    }
  }, [callState]);

  useEffect(() => {
    // Set up WebRTC event listeners for streams
    const handleLocalStream = (stream: any) => {
      setLocalStream(stream);
    };

    const handleRemoteStream = (stream: any) => {
      setRemoteStream(stream);
    };

    webrtcService.on('localStream', handleLocalStream);
    webrtcService.on('remoteStream', handleRemoteStream);

    return () => {
      webrtcService.off('localStream', handleLocalStream);
      webrtcService.off('remoteStream', handleRemoteStream);
    };
  }, []);

  if (!callState) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStatus = () => {
    if (callState.isConnecting) return 'Connecting...';
    if (callState.isActive) return 'Connected';
    return 'Calling...';
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Remote Video (Full Screen) - Show placeholder for now */}
      {callState.callType === 'video' && remoteStream && (
        <View style={styles.remoteVideo}>
          <View style={styles.videoPlaceholder}>
            <Ionicons name="videocam" size={80} color="#fff" />
            <Text style={styles.videoPlaceholderText}>Remote Video</Text>
          </View>
        </View>
      )}

      {/* Call Info Overlay */}
      <View style={styles.callInfoOverlay}>
        <Text style={styles.remoteName}>{callState.remoteUserName}</Text>
        <Text style={styles.callStatus}>{getCallStatus()}</Text>
        <Text style={styles.callDuration}>
          {formatDuration(callState.duration)}
        </Text>
      </View>

      {/* Local Video (Picture-in-Picture) - Show placeholder for now */}
      {callState.callType === 'video' && localStream && (
        <View style={styles.localVideoContainer}>
          <View style={styles.localVideoPlaceholder}>
            <Ionicons name="videocam" size={40} color="#fff" />
            <Text style={styles.localVideoPlaceholderText}>You</Text>
          </View>
        </View>
      )}

      {/* Call Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          {/* Mute Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              callState.isMuted && styles.controlButtonActive
            ]}
            onPress={toggleMute}
          >
            <Ionicons
              name={callState.isMuted ? 'mic-off' : 'mic'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>

          {/* Video Toggle Button (Video calls only) */}
          {callState.callType === 'video' && (
            <TouchableOpacity
              style={[
                styles.controlButton,
                callState.isVideoOff && styles.controlButtonActive
              ]}
              onPress={toggleVideo}
            >
              <Ionicons
                name={callState.isVideoOff ? 'videocam-off' : 'videocam'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          )}

          {/* Switch Camera Button (Video calls only) */}
          {callState.callType === 'video' && (
            <TouchableOpacity
              style={styles.controlButton}
              onPress={switchCamera}
            >
              <Ionicons name="camera-reverse" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* End Call Button */}
        <TouchableOpacity
          style={styles.endCallButton}
          onPress={endCall}
        >
          <Ionicons name="call" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Audio Call Interface */}
      {callState.callType === 'audio' && (
        <View style={styles.audioCallInterface}>
          <View style={styles.audioAvatar}>
            <Ionicons name="person" size={60} color="#fff" />
          </View>
          <Text style={styles.audioCallerName}>{callState.remoteUserName}</Text>
          <Text style={styles.audioCallStatus}>{getCallStatus()}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 40,
    borderRadius: 20,
  },
  videoPlaceholderText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  callInfoOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    alignItems: 'center',
    paddingTop: 20,
  },
  remoteName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  callStatus: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  callDuration: {
    fontSize: 14,
    color: '#999',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  localVideoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  localVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoPlaceholderText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  audioCallInterface: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  audioCallerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  audioCallStatus: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
  },
});

export default ActiveCallScreen;
