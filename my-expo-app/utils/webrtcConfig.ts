export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
}

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export function getWebRTCConfig(): WebRTCConfig {
  // STUN servers for NAT traversal
  const stun: IceServerConfig[] = [
    { urls: ['stun:stun.l.google.com:19302'] },
    { urls: ['stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302'] },
    { urls: ['stun:stun3.l.google.com:19302'] },
    { urls: ['stun:stun4.l.google.com:19302'] }
  ];

  // TURN servers for relay (you can add your own TURN server credentials)
  const turn: IceServerConfig[] = [];
  
  // Add your TURN server configuration here if you have one
  // const turnUrl = process.env.EXPO_PUBLIC_TURN_URL;
  // const turnUsername = process.env.EXPO_PUBLIC_TURN_USERNAME;
  // const turnCredential = process.env.EXPO_PUBLIC_TURN_CREDENTIAL;
  
  // if (turnUrl && turnUsername && turnCredential) {
  //   turn.push({
  //     urls: turnUrl,
  //     username: turnUsername,
  //     credential: turnCredential
  //   });
  // }

  const iceServers: IceServerConfig[] = [...stun, ...turn];

  return {
    iceServers,
    iceTransportPolicy: 'all',
  };
}

export type CallType = 'audio' | 'video';
