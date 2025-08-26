import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { chatSocketService } from '../utils/chatSocket';
import { webrtcService } from '../utils/webrtcService';
import { CallState, CallInvite, CallType, CallAction } from '../types/chat';
import { useAppSelector } from '../store';

interface CallContextType {
  callState: CallState | null;
  incomingCall: CallInvite | null;
  initiateCall: (conversationId: string, callType: CallType, remoteUserId: string, remoteUserName: string) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: (reason?: string) => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

interface CallProviderProps {
  children: React.ReactNode;
}

export const CallProvider: React.FC<CallProviderProps> = ({ children }) => {
  const { user } = useAppSelector((state) => state.auth);
  const [callState, setCallState] = useState<CallState | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallInvite | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!user) return;

    // Set up socket event listeners for calls
    chatSocketService.on('call_invite', handleIncomingCall);
    chatSocketService.on('call_accepted', handleCallAccepted);
    chatSocketService.on('call_rejected', handleCallRejected);
    chatSocketService.on('call_cancelled', handleCallCancelled);
    chatSocketService.on('call_ended', handleCallEnded);
    chatSocketService.on('webrtc_signal', handleWebRTCSignal);

    // Set up WebRTC event listeners
    webrtcService.on('localStream', handleLocalStream);
    webrtcService.on('remoteStream', handleRemoteStream);
    webrtcService.on('iceCandidate', handleIceCandidate);
    webrtcService.on('connectionStateChange', handleConnectionStateChange);

    return () => {
      chatSocketService.off('call_invite');
      chatSocketService.off('call_accepted');
      chatSocketService.off('call_rejected');
      chatSocketService.off('call_cancelled');
      chatSocketService.off('call_ended');
      chatSocketService.off('webrtc_signal');
      
      webrtcService.off('localStream');
      webrtcService.off('remoteStream');
      webrtcService.off('iceCandidate');
      webrtcService.off('connectionStateChange');
      
      cleanupCall();
    };
  }, [user]);

  const handleIncomingCall = (data: CallInvite) => {
    if (data.fromUserId === user?._id) return; // Don't show own calls
    
    setIncomingCall(data);
    
    // Play ringtone (you can implement this with expo-av)
    // playRingtone();
  };

  const handleCallAccepted = async (data: { conversationId: string; fromUserId: string }) => {
    if (data.fromUserId === user?._id) return;
    
    try {
      // Initialize WebRTC for incoming call
      await webrtcService.initialize(incomingCall?.callType || 'audio');
      
      // Create answer
      const answer = await webrtcService.createAnswer();
      
      // Send answer to caller
      chatSocketService.sendWebRTCSignal(data.conversationId, {
        type: 'sdp',
        sdp: answer
      });
      
      // Update call state
      setCallState({
        isIncoming: false,
        isOutgoing: false,
        isActive: true,
        isConnecting: false,
        isMuted: false,
        isVideoOff: false,
        callType: incomingCall?.callType || 'audio',
        conversationId: data.conversationId,
        remoteUserId: data.fromUserId,
        remoteUserName: incomingCall ? 'User' : 'Unknown',
        duration: 0,
        startTime: new Date()
      });
      
      setIncomingCall(null);
      startDurationTimer();
    } catch (error) {
      console.error('Failed to accept call:', error);
      rejectIncomingCall('failed');
    }
  };

  const handleCallRejected = (data: { conversationId: string; fromUserId: string; reason: string }) => {
    if (data.fromUserId === user?._id) return;
    
    if (callState?.conversationId === data.conversationId) {
      cleanupCall();
    }
  };

  const handleCallCancelled = (data: { conversationId: string; fromUserId: string }) => {
    if (data.fromUserId === user?._id) return;
    
    if (callState?.conversationId === data.conversationId) {
      cleanupCall();
    }
    setIncomingCall(null);
  };

  const handleCallEnded = (data: { conversationId: string; fromUserId: string }) => {
    if (data.fromUserId === user?._id) return;
    
    if (callState?.conversationId === data.conversationId) {
      cleanupCall();
    }
  };

  const handleWebRTCSignal = async (data: { conversationId: string; signal: any }) => {
    if (callState?.conversationId !== data.conversationId) return;
    
    try {
      const { signal } = data;
      
      if (signal.type === 'sdp') {
        if (signal.sdp.type === 'offer') {
          await webrtcService.setRemoteDescription(signal.sdp);
          const answer = await webrtcService.createAnswer();
          chatSocketService.sendWebRTCSignal(data.conversationId, {
            type: 'sdp',
            sdp: answer
          });
        } else if (signal.sdp.type === 'answer') {
          await webrtcService.setRemoteDescription(signal.sdp);
        }
      } else if (signal.type === 'ice' && signal.candidate) {
        await webrtcService.addIceCandidate(signal.candidate);
      }
    } catch (error) {
      console.error('Failed to handle WebRTC signal:', error);
    }
  };

  const handleLocalStream = (stream: any) => {
    console.log('Local stream received');
  };

  const handleRemoteStream = (stream: any) => {
    console.log('Remote stream received');
    if (callState) {
      setCallState(prev => prev ? { ...prev, isConnecting: false } : null);
    }
  };

  const handleIceCandidate = (candidate: RTCIceCandidateInit) => {
    if (callState) {
      chatSocketService.sendWebRTCSignal(callState.conversationId, {
        type: 'ice',
        candidate
      });
    }
  };

  const handleConnectionStateChange = (state: string) => {
    console.log('Connection state changed:', state);
    if (state === 'connected' && callState) {
      setCallState(prev => prev ? { ...prev, isConnecting: false } : null);
    }
  };

  const initiateCall = async (conversationId: string, callType: CallType, remoteUserId: string, remoteUserName: string) => {
    try {
      // Initialize WebRTC
      await webrtcService.initialize(callType);
      
      // Create offer
      const offer = await webrtcService.createOffer();
      
      // Send call invite
      chatSocketService.inviteToCall(conversationId, callType);
      
      // Update call state
      setCallState({
        isIncoming: false,
        isOutgoing: true,
        isActive: false,
        isConnecting: true,
        isMuted: false,
        isVideoOff: false,
        callType,
        conversationId,
        remoteUserId,
        remoteUserName,
        duration: 0,
        startTime: new Date()
      });
      
      // Send offer
      chatSocketService.sendWebRTCSignal(conversationId, {
        type: 'sdp',
        sdp: offer
      });
    } catch (error) {
      console.error('Failed to initiate call:', error);
      throw error;
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    
    try {
      chatSocketService.acceptCall(incomingCall.conversationId);
    } catch (error) {
      console.error('Failed to accept call:', error);
      rejectIncomingCall('failed');
    }
  };

  const rejectIncomingCall = (reason: string = 'declined') => {
    if (!incomingCall) return;
    
    try {
      chatSocketService.rejectCall(incomingCall.conversationId, reason);
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
    
    setIncomingCall(null);
  };

  const endCall = () => {
    if (!callState) return;
    
    try {
      chatSocketService.endCall(callState.conversationId);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
    
    cleanupCall();
  };

  const toggleMute = () => {
    if (!callState) return;
    
    const isMuted = webrtcService.toggleMute();
    setCallState(prev => prev ? { ...prev, isMuted } : null);
  };

  const toggleVideo = () => {
    if (!callState || callState.callType !== 'video') return;
    
    const isVideoOff = webrtcService.toggleVideo();
    setCallState(prev => prev ? { ...prev, isVideoOff } : null);
  };

  const switchCamera = () => {
    if (!callState || callState.callType !== 'video') return;
    
    webrtcService.switchCamera();
  };

  const startDurationTimer = () => {
    startTimeRef.current = new Date();
    durationTimerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
        setCallState(prev => prev ? { ...prev, duration } : null);
      }
    }, 1000);
  };

  const cleanupCall = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    
    startTimeRef.current = null;
    setCallState(null);
    setIncomingCall(null);
    
    webrtcService.cleanup();
  };

  const value: CallContextType = {
    callState,
    incomingCall,
    initiateCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};
