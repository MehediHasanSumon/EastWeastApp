import {
  Camera,
  CameraOff,
  CheckCircle,
  Clock,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getWebRTCConfig, type CallType } from "../../service/webrtcConfig";
import chatSocketService from "../../socket/chatSocket";

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  callType: CallType;
  isCaller: boolean;
}

const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose, conversationId, callType, isCaller }) => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const ringTimerRef = useRef<number | null>(null);
  const ringContextRef = useRef<AudioContext | null>(null);
  const ringGainRef = useRef<GainNode | null>(null);
  const outgoingTimeoutRef = useRef<number | null>(null);

  const constraints = useMemo(() => ({
    audio: true,
    video: callType === "video"
  }), [callType]);

  const cleanupMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  const closeCall = useCallback(() => {
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    cleanupMedia();
    setConnecting(false);
    setConnected(false);
    try { chatSocketService.cancelCall({ conversationId }); } catch {}
    // stop ringtone if any
    try {
      if (ringTimerRef.current) { window.clearInterval(ringTimerRef.current); ringTimerRef.current = null; }
      if (ringGainRef.current) { ringGainRef.current.gain.value = 0; }
      if (ringContextRef.current) { ringContextRef.current.close(); ringContextRef.current = null; }
    } catch {}
    onClose();
  }, [cleanupMedia, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    const pc = new RTCPeerConnection(getWebRTCConfig());
    try { chatSocketService.joinCallRoom(conversationId); } catch {}
    pcRef.current = pc;

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setConnected(true);
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        // Gracefully end
        closeCall();
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        chatSocketService.sendWebRTCSignal({
          conversationId,
          signal: { type: "ice", candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        const [stream] = event.streams;
        remoteVideoRef.current.srcObject = stream;
      }
    };

    const start = async () => {
      try {
        setConnecting(true);
        // Start outgoing ringtone for caller until connected
        if (isCaller) {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = 440; // A4
            gain.gain.value = 0; // start silent
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            ringContextRef.current = ctx;
            ringGainRef.current = gain;
            // ring pattern: 1s on, 2s off
            const ring = () => {
              if (!ringGainRef.current) return;
              ringGainRef.current.gain.setTargetAtTime(0.05, ctx.currentTime, 0.01);
              setTimeout(() => {
                if (!ringGainRef.current) return;
                ringGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
              }, 1000);
            };
            ring();
            ringTimerRef.current = window.setInterval(ring, 3000);
          } catch {}
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) return;
        localStreamRef.current = stream;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        if (isCaller) {
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === "video" });
          await pc.setLocalDescription(offer);
          chatSocketService.sendWebRTCSignal({ conversationId, signal: { type: "sdp", sdp: offer } });
          chatSocketService.inviteToCall({ conversationId, callType });
          // Auto-cancel after 30s if not connected
          outgoingTimeoutRef.current = window.setTimeout(() => {
            if (!connected) {
              closeCall();
            }
          }, 30000) as unknown as number;
        }
      } catch (err) {
        console.error("Failed to start call", err);
        closeCall();
      } finally {
        setConnecting(false);
      }
    };

    start();

    const onSignal = async (data: any) => {
      if (!data || data.conversationId !== conversationId) return;
      const { signal } = data;
      if (!signal) return;
      if (signal.type === "sdp") {
        if (signal.sdp.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          chatSocketService.sendWebRTCSignal({ conversationId, signal: { type: "sdp", sdp: answer } });
        } else if (signal.sdp.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
        // stop ringtone when SDP exchanged (call progressing)
        try {
          if (ringTimerRef.current) { window.clearInterval(ringTimerRef.current); ringTimerRef.current = null; }
          if (ringGainRef.current) { ringGainRef.current.gain.value = 0; }
          if (ringContextRef.current) { ringContextRef.current.close(); ringContextRef.current = null; }
        } catch {}
      } else if (signal.type === "ice" && signal.candidate) {
        try { await pc.addIceCandidate(signal.candidate); } catch {}
      }
    };

    const onCancelled = (data: any) => {
      if (data?.conversationId === conversationId) closeCall();
    };
    const onRejected = (data: any) => {
      if (data?.conversationId === conversationId) closeCall();
    };

    chatSocketService.on("webrtc_signal", onSignal);
    chatSocketService.on("call_cancelled", onCancelled);
    chatSocketService.on("call_rejected", onRejected);
    const onAccepted = (data: any) => {
      if (data?.conversationId !== conversationId) return;
      // stop ringtone promptly on accept
      try {
        if (ringTimerRef.current) { window.clearInterval(ringTimerRef.current); ringTimerRef.current = null; }
        if (ringGainRef.current) { ringGainRef.current.gain.value = 0; }
        if (ringContextRef.current) { ringContextRef.current.close(); ringContextRef.current = null; }
      } catch {}
    };
    chatSocketService.on("call_accepted", onAccepted);

    return () => {
      isCancelled = true;
      chatSocketService.off("webrtc_signal", onSignal);
      chatSocketService.off("call_cancelled", onCancelled);
      chatSocketService.off("call_rejected", onRejected);
      chatSocketService.off("call_accepted", onAccepted);
      try { pc.close(); } catch {}
      cleanupMedia();
      try {
        if (ringTimerRef.current) { window.clearInterval(ringTimerRef.current); ringTimerRef.current = null; }
        if (ringGainRef.current) { ringGainRef.current.gain.value = 0; }
        if (ringContextRef.current) { ringContextRef.current.close(); ringContextRef.current = null; }
      } catch {}
      if (outgoingTimeoutRef.current) { window.clearTimeout(outgoingTimeoutRef.current); outgoingTimeoutRef.current = null; }
    };
  }, [isOpen, conversationId, callType, isCaller, cleanupMedia, closeCall]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/95 via-slate-900/95 to-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800/80 to-gray-800/80 backdrop-blur-sm px-6 py-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : connecting ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`}></div>
                <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                  {callType === "video" ? <Video className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  <span>{callType === "video" ? "Video Call" : "Audio Call"}</span>
                </h3>
              </div>
              <div className="text-sm text-gray-300 bg-gray-700/50 px-3 py-1 rounded-full flex items-center space-x-2">
                {connecting && <><Loader2 className="w-4 h-4 animate-spin" /> <span>Connecting...</span></>}
                {connected && <><CheckCircle className="w-4 h-4" /> <span>Connected</span></>}
                {!connecting && !connected && <><Clock className="w-4 h-4" /> <span>Waiting...</span></>}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center space-x-3">
              <button
                className={`group relative px-4 py-2 rounded-xl font-medium text-white transition-all duration-200 transform hover:scale-105 ${
                  isMuted
                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25"
                    : "bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-500 hover:to-slate-500 shadow-lg shadow-gray-500/25"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
                onClick={() => {
                  const stream = localStreamRef.current;
                  if (!stream) return;
                  const audio = stream.getAudioTracks()[0];
                  if (!audio) return;
                  audio.enabled = !audio.enabled;
                  setIsMuted(!audio.enabled ? true : false);
                }}
              >
                <span className="flex items-center space-x-2">
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isMuted ? "Unmute" : "Mute"}</span>
                </span>
              </button>

              {callType === "video" && (
                <button
                  className={`group relative px-4 py-2 rounded-xl font-medium text-white transition-all duration-200 transform hover:scale-105 ${
                    isVideoOff
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25"
                      : "bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-500 hover:to-slate-500 shadow-lg shadow-gray-500/25"
                  }`}
                  title={isVideoOff ? "Turn camera on" : "Turn camera off"}
                  onClick={() => {
                    const stream = localStreamRef.current;
                    if (!stream) return;
                    const video = stream.getVideoTracks()[0];
                    if (!video) return;
                    video.enabled = !video.enabled;
                    setIsVideoOff(!video.enabled ? true : false);
                  }}
                >
                  <span className="flex items-center space-x-2">
                    {isVideoOff ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    <span>{isVideoOff ? "Camera Off" : "Camera On"}</span>
                  </span>
                </button>
              )}

              <button
                className="group relative px-6 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg shadow-red-500/25"
                onClick={closeCall}
              >
                <span className="flex items-center space-x-2">
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative p-6 bg-gradient-to-br from-gray-900/50 to-slate-900/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Local Video */}
            <div className="relative group">
              <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-2">
                <span>You</span>
                {isMuted && <MicOff className="w-3 h-3" />}
                {isVideoOff && <VideoOff className="w-3 h-3" />}
              </div>
              <div className="bg-gradient-to-br from-gray-800 to-slate-800 aspect-video rounded-2xl overflow-hidden border border-gray-600/30 shadow-xl">
                {callType === "video" ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/20 to-purple-900/20">
                    <div className="text-center">
                      <Mic className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <div className="text-gray-400 text-sm">Audio Only</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Remote Video */}
            <div className="relative group">
              <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium">
                Remote User
              </div>
              <div className="bg-gradient-to-br from-gray-800 to-slate-800 aspect-video rounded-2xl overflow-hidden border border-gray-600/30 shadow-xl">
                {callType === "video" ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-900/20 to-teal-900/20">
                    <div className="text-center">
                      <div className="text-6xl text-gray-400 mb-2">🎧</div>
                      <div className="text-gray-400 text-lg">Audio Call</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-800/80 to-gray-800/80 backdrop-blur-sm px-6 py-4 border-t border-gray-700/50">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 text-gray-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm">
                {connecting && "Establishing connection..."}
                {connected && "Call is active"}
                {!connecting && !connected && "Preparing call..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
