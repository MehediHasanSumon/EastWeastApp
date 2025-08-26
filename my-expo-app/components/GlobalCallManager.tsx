import React from 'react';
import { View } from 'react-native';
import { useCall } from '../context/CallContext';
import IncomingCallModal from './IncomingCallModal';
import ActiveCallScreen from './ActiveCallScreen';

const GlobalCallManager: React.FC = () => {
  const { incomingCall, callState } = useCall();

  return (
    <View style={{ flex: 1 }}>
      {/* Incoming Call Modal */}
      <IncomingCallModal />

      {/* Active Call Screen */}
      {callState && <ActiveCallScreen />}
    </View>
  );
};

export default GlobalCallManager;
