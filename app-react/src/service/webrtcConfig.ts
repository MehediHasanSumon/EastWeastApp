export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface WebRTCConfig {
  iceServers: IceServerConfig[];
  iceTransportPolicy?: RTCIceTransportPolicy;
}

export function getWebRTCConfig(): WebRTCConfig {
  const stun = [{ urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] }];

  const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;

  const iceServers: IceServerConfig[] = [...stun];

  if (turnUrl && turnUsername && turnCredential) {
    iceServers.push({ urls: turnUrl, username: turnUsername, credential: turnCredential });
  }

  return {
    iceServers,
    iceTransportPolicy: "all",
  };
}

export type CallType = "audio" | "video";


