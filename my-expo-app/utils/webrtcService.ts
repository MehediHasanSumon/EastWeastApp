import { getWebRTCConfig, CallType } from './webrtcConfig';
import { Audio } from 'expo-av';
import * as Permissions from 'expo-permissions';

export interface WebRTCSignal {
  type: 'sdp' | 'ice';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface WebRTCEvent {
  type: 'localStream' | 'remoteStream' | 'iceCandidate' | 'connectionStateChange' | 'error';
  data?: any;
}

// Mock MediaStream and MediaStreamTrack for React Native compatibility
interface MockMediaStreamTrack {
  kind: 'audio' | 'video';
  enabled: boolean;
  id: string;
  muted: boolean;
  readyState: string;
  stop: () => void;
  getSettings: () => any;
  getCapabilities: () => any;
  applyConstraints: (constraints: any) => Promise<void>;
}

interface MockMediaStream {
  id: string;
  active: boolean;
  getTracks: () => MockMediaStreamTrack[];
  getAudioTracks: () => MockMediaStreamTrack[];
  getVideoTracks: () => MockMediaStreamTrack[];
  getTrackById: (id: string) => MockMediaStreamTrack | undefined;
  addTrack: (track: MockMediaStreamTrack) => void;
  removeTrack: (track: MockMediaStreamTrack) => void;
  clone: () => MockMediaStream;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MockMediaStream | null = null;
  private remoteStream: MockMediaStream | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitialized = false;
  private cameraPermission: boolean = false;
  private audioPermission: boolean = false;

  async initialize(callType: CallType): Promise<MockMediaStream> {
    try {
      console.log(`Initializing WebRTC service for ${callType} call...`);
      
      // Request permissions first
      await this.requestPermissions(callType);
      
      if (!this.audioPermission) {
        throw new Error('Microphone permission is required');
      }

      if (callType === 'video' && !this.cameraPermission) {
        throw new Error('Camera permission is required for video calls');
      }

      console.log('Permissions granted, creating mock MediaStream...');

      // Create a mock MediaStream for React Native
      this.localStream = this.createMockMediaStream(callType);
      
      console.log('Creating RTCPeerConnection...');
      
      // Create peer connection
      const config = getWebRTCConfig();
      this.peerConnection = new RTCPeerConnection(config);

      // Add local stream tracks to peer connection
      if (this.localStream) {
        const tracks = this.localStream.getTracks();
        console.log(`Adding ${tracks.length} tracks to peer connection...`);
        
        tracks.forEach(track => {
          if (this.peerConnection) {
            try {
              this.peerConnection.addTrack(track as any, this.localStream as any);
              console.log(`Added ${track.kind} track to peer connection`);
            } catch (error) {
              console.error(`Failed to add ${track.kind} track:`, error);
            }
          }
        });
      }

      // Set up event handlers
      this.setupPeerConnectionHandlers();

      this.isInitialized = true;
      console.log('WebRTC service initialized successfully');
      
      this.emit('localStream', this.localStream);
      
      return this.localStream;
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  private async requestPermissions(callType: CallType): Promise<void> {
    try {
      console.log('Requesting audio permission...');
      
      // Request audio permission
      const audioStatus = await Audio.requestPermissionsAsync();
      this.audioPermission = audioStatus.status === 'granted';
      
      if (!this.audioPermission) {
        throw new Error('Microphone permission denied');
      }

      console.log('Audio permission granted');

      // Request camera permission for video calls
      if (callType === 'video') {
        try {
          console.log('Requesting camera permission...');
          const { Camera } = await import('expo-camera');
          const cameraStatus = await Camera.requestCameraPermissionsAsync();
          this.cameraPermission = cameraStatus.status === 'granted';
          
          if (!this.cameraPermission) {
            throw new Error('Camera permission denied');
          }
          
          console.log('Camera permission granted');
        } catch (cameraError) {
          console.warn('Camera module not available, video calls will not work:', cameraError);
          this.cameraPermission = false;
        }
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      throw error;
    }
  }

  private createMockMediaStream(callType: CallType): MockMediaStream {
    const streamId = `stream_${Date.now()}`;
    console.log(`Creating mock MediaStream with ID: ${streamId}`);
    
    // Create mock audio track
    const audioTrack: MockMediaStreamTrack = {
      kind: 'audio',
      enabled: true,
      id: `audio_${Date.now()}`,
      muted: false,
      readyState: 'live',
      stop: () => {
        console.log('Audio track stopped');
        audioTrack.enabled = false;
        audioTrack.readyState = 'ended';
      },
      getSettings: () => ({
        sampleRate: 44100,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }),
      getCapabilities: () => ({
        sampleRate: { min: 8000, max: 48000 },
        channelCount: { min: 1, max: 2 },
        echoCancellation: [true, false],
        noiseSuppression: [true, false]
      }),
      applyConstraints: async (constraints: any) => {
        console.log('Applying audio constraints:', constraints);
        return Promise.resolve();
      }
    };

    // Create mock video track for video calls
    let videoTrack: MockMediaStreamTrack | null = null;
    if (callType === 'video') {
      videoTrack = {
        kind: 'video',
        enabled: true,
        id: `video_${Date.now()}`,
        muted: false,
        readyState: 'live',
        stop: () => {
          console.log('Video track stopped');
          if (videoTrack) {
            videoTrack.enabled = false;
            videoTrack.readyState = 'ended';
          }
        },
        getSettings: () => ({
          width: 1280,
          height: 720,
          facingMode: 'user',
          frameRate: 30
        }),
        getCapabilities: () => ({
          width: { min: 320, max: 1920 },
          height: { min: 240, max: 1080 },
          frameRate: { min: 1, max: 60 },
          facingMode: ['user', 'environment']
        }),
        applyConstraints: async (constraints: any) => {
          console.log('Applying video constraints:', constraints);
          return Promise.resolve();
        }
      };
    }

    const tracks = [audioTrack];
    if (videoTrack) {
      tracks.push(videoTrack);
    }

    console.log(`Created ${tracks.length} tracks (${tracks.filter(t => t.kind === 'audio').length} audio, ${tracks.filter(t => t.kind === 'video').length} video)`);

    const mockStream: MockMediaStream = {
      id: streamId,
      active: true,
      getTracks: () => tracks,
      getAudioTracks: () => tracks.filter(track => track.kind === 'audio'),
      getVideoTracks: () => tracks.filter(track => track.kind === 'video'),
      getTrackById: (id: string) => tracks.find(track => track.id === id),
      addTrack: (track: MockMediaStreamTrack) => {
        tracks.push(track);
        console.log('Track added:', track);
      },
      removeTrack: (track: MockMediaStreamTrack) => {
        const index = tracks.indexOf(track);
        if (index > -1) {
          tracks.splice(index, 1);
          console.log('Track removed:', track);
        }
      },
      clone: () => this.createMockMediaStream(callType)
    };

    return mockStream;
  }

  private setupPeerConnectionHandlers() {
    if (!this.peerConnection) return;

    console.log('Setting up peer connection event handlers...');

    // Handle incoming tracks
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event);
      // Create a mock remote stream
      this.remoteStream = this.createMockMediaStream('audio'); // Default to audio
      this.emit('remoteStream', this.remoteStream);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate generated:', event.candidate);
        this.emit('iceCandidate', event.candidate);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        const state = this.peerConnection.connectionState;
        console.log('Connection state changed:', state);
        this.emit('connectionStateChange', state);
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        const state = this.peerConnection.iceConnectionState;
        console.log('ICE connection state:', state);
      }
    };

    // Handle signaling state changes
    this.peerConnection.onsignalingstatechange = () => {
      if (this.peerConnection) {
        const state = this.peerConnection.signalingState;
        console.log('Signaling state:', state);
      }
    };

    console.log('Peer connection event handlers set up successfully');
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection || !this.isInitialized) {
      throw new Error('WebRTC not initialized');
    }

    try {
      console.log('Creating offer...');
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log('Offer created and set as local description');
      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection || !this.isInitialized) {
      throw new Error('WebRTC not initialized');
    }

    try {
      console.log('Creating answer...');
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log('Answer created and set as local description');
      return answer;
    } catch (error) {
      console.error('Failed to create answer:', error);
      throw error;
    }
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection || !this.isInitialized) {
      throw new Error('WebRTC not initialized');
    }

    try {
      console.log('Setting remote description:', description.type);
      await this.peerConnection.setRemoteDescription(description);
      console.log('Remote description set successfully');
    } catch (error) {
      console.error('Failed to set remote description:', error);
      throw error;
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection || !this.isInitialized) {
      throw new Error('WebRTC not initialized');
    }

    try {
      console.log('Adding ICE candidate...');
      await this.peerConnection.addIceCandidate(candidate);
      console.log('ICE candidate added successfully');
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
      throw error;
    }
  }

  toggleMute(): boolean {
    if (!this.localStream) return false;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const isMuted = !audioTrack.enabled;
      console.log(`Audio ${isMuted ? 'muted' : 'unmuted'}`);
      return isMuted; // Return muted state
    }
    return false;
  }

  toggleVideo(): boolean {
    if (!this.localStream) return false;
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const isVideoOff = !videoTrack.enabled;
      console.log(`Video ${isVideoOff ? 'turned off' : 'turned on'}`);
      return isVideoOff; // Return video off state
    }
    return false;
  }

  switchCamera(): void {
    if (!this.localStream) return;
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack && videoTrack.getCapabilities().facingMode) {
      const facingMode = videoTrack.getSettings().facingMode;
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      
      console.log(`Switching camera from ${facingMode} to ${newFacingMode}`);
      
      videoTrack.applyConstraints({
        facingMode: newFacingMode
      });
    }
  }

  getLocalStream(): MockMediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MockMediaStream | null {
    return this.remoteStream;
  }

  getConnectionState(): string | null {
    return this.peerConnection?.connectionState || null;
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.eventListeners.delete(event);
    } else {
      const callbacks = this.eventListeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.eventListeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebRTC event listener for ${event}:`, error);
        }
      });
    }
  }

  cleanup() {
    console.log('Cleaning up WebRTC service...');
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    this.remoteStream = null;
    this.isInitialized = false;
    this.eventListeners.clear();
    
    console.log('WebRTC service cleanup completed');
  }
}

export const webrtcService = new WebRTCService();
