import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../context/CallContext';
import { CallType } from '../types/chat';

const { width, height } = Dimensions.get('window');

const IncomingCallModal: React.FC = () => {
  const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useCall();
  const [ringAnimation] = useState(new Animated.Value(1));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (incomingCall) {
      setIsVisible(true);
      startRingAnimation();
      startVibration();
    } else {
      setIsVisible(false);
      stopRingAnimation();
      stopVibration();
    }
  }, [incomingCall]);

  const startRingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(ringAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopRingAnimation = () => {
    ringAnimation.stopAnimation();
    ringAnimation.setValue(1);
  };

  const startVibration = () => {
    // Vibrate pattern: wait 1s, vibrate 1s, wait 1s, vibrate 1s
    Vibration.vibrate([1000, 1000, 1000, 1000], true);
  };

  const stopVibration = () => {
    Vibration.cancel();
  };

  const handleAccept = async () => {
    try {
      await acceptIncomingCall();
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleReject = () => {
    rejectIncomingCall('declined');
  };

  if (!incomingCall || !isVisible) return null;

  const getCallTypeIcon = () => {
    return incomingCall.callType === 'video' ? 'videocam' : 'call';
  };

  const getCallTypeText = () => {
    return incomingCall.callType === 'video' ? 'Video Call' : 'Audio Call';
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Caller Avatar */}
          <Animated.View
            style={[
              styles.avatarContainer,
              { transform: [{ scale: ringAnimation }] }
            ]}
          >
            <View style={styles.avatar}>
              <Ionicons
                name={getCallTypeIcon()}
                size={40}
                color="#fff"
              />
            </View>
          </Animated.View>

          {/* Caller Info */}
          <Text style={styles.callerName}>Incoming Call</Text>
          <Text style={styles.callType}>{getCallTypeText()}</Text>

          {/* Call Duration */}
          <Text style={styles.duration}>Ringing...</Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Accept Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
            >
              <Ionicons name="call" size={30} color="#fff" />
            </TouchableOpacity>

            {/* Reject Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleReject}
            >
              <Ionicons name="call" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  avatarContainer: {
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  callerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  callType: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
  },
  duration: {
    fontSize: 16,
    color: '#999',
    marginBottom: 40,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    transform: [{ rotate: '45deg' }],
  },
  rejectButton: {
    backgroundColor: '#F44336',
    transform: [{ rotate: '45deg' }],
  },
});

export default IncomingCallModal;
