import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import chatSocketService from "../../socket/chatSocket";
import CallModal from "./CallModal";

type CallType = "audio" | "video";

interface RootStateLike {
  auth: { user: any | null };
  chat: { conversations: Array<{ _id: string; participants: any[]; type: string; name?: string }> };
}

const GlobalCallManager: React.FC = () => {
  const user = useSelector((s: RootStateLike) => s.auth.user);
  const conversations = useSelector((s: RootStateLike) => s.chat.conversations);
  const [incoming, setIncoming] = useState<null | { conversationId: string; fromUserId: string; callType: CallType }>(null);
  const [activeCall, setActiveCall] = useState<null | { conversationId: string; callType: CallType; isCaller: boolean }>(null);
  const connectedRef = useRef(false);

  // Ensure socket connected app-wide when user present
  useEffect(() => {
    if (user && !connectedRef.current) {
      try {
        chatSocketService.connect();
        connectedRef.current = true;
      } catch {}
    }
    return () => {
      // Do not disconnect on unmount here; keep socket for app lifetime
    };
  }, [user]);

  // Listen for call signaling at app level
  useEffect(() => {
    if (!user) return;

    const onInvite = (data: any) => {
      if (!data?.conversationId || !data?.fromUserId) return;
      // Ignore self-originated
      const uid = user.id || user._id;
      if (data.fromUserId === uid) return;
      setIncoming({ conversationId: data.conversationId, fromUserId: data.fromUserId, callType: data.callType });
    };
    const onCancelled = (data: any) => {
      if (incoming && data?.conversationId === incoming.conversationId) setIncoming(null);
      if (activeCall && data?.conversationId === activeCall.conversationId) setActiveCall(null);
    };
    const onRejected = (data: any) => {
      if (activeCall && data?.conversationId === activeCall.conversationId) setActiveCall(null);
    };
    const onAccepted = (_data: any) => {
      // optional hook for UI
    };

    chatSocketService.on("call_invite", onInvite);
    chatSocketService.on("call_cancelled", onCancelled);
    chatSocketService.on("call_rejected", onRejected);
    chatSocketService.on("call_accepted", onAccepted);
    chatSocketService.on("call_error", (err: any) => {
      console.error("Call error:", err);
    });

    return () => {
      chatSocketService.off("call_invite", onInvite);
      chatSocketService.off("call_cancelled", onCancelled);
      chatSocketService.off("call_rejected", onRejected);
      chatSocketService.off("call_accepted", onAccepted);
      chatSocketService.off("call_error");
    };
  }, [user, incoming, activeCall]);

  const callerName = useMemo(() => {
    if (!incoming) return "";
    // Find name from conversations
    const conv = conversations.find((c) => c._id === incoming.conversationId);
    const userId = incoming.fromUserId;
    const p = conv?.participants?.find((x: any) => (x._id || x.id) === userId);
    return p?.name || "Incoming call";
  }, [incoming, conversations]);

  const acceptIncoming = () => {
    if (!incoming) return;
    try { chatSocketService.acceptCall({ conversationId: incoming.conversationId }); } catch {}
    setActiveCall({ conversationId: incoming.conversationId, callType: incoming.callType, isCaller: false });
    setIncoming(null);
  };

  const rejectIncoming = () => {
    if (!incoming) return;
    try { chatSocketService.rejectCall({ conversationId: incoming.conversationId, reason: "declined" }); } catch {}
    setIncoming(null);
  };

  // Incoming ringtone while prompt visible
  useEffect(() => {
    if (!incoming) return;
    let ctx: AudioContext | null = null;
    let osc: OscillatorNode | null = null;
    let gain: GainNode | null = null;
    let interval: number | null = null;
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      osc = ctx.createOscillator();
      gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 480; // ring tone
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      const ring = () => {
        if (!gain || !ctx) return;
        gain.gain.setTargetAtTime(0.07, ctx.currentTime, 0.01);
        setTimeout(() => { if (gain && ctx) gain.gain.setTargetAtTime(0, ctx.currentTime, 0.01); }, 1000);
      };
      ring();
      interval = window.setInterval(ring, 3000);
    } catch {}
    return () => {
      try {
        if (interval) window.clearInterval(interval);
        if (gain) gain.gain.value = 0;
        if (osc) osc.stop();
        if (ctx) ctx.close();
      } catch {}
    };
  }, [incoming]);

  return (
    <>
      {/* Incoming call prompt */}
      {incoming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-700/50 backdrop-blur-xl animate-pulse">
            
            {/* Header with glow effect */}
            <div className="relative p-8 text-center bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-b border-slate-700/50">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-t-3xl"></div>
              
              {/* Call type icon */}
              <div className="relative w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 animate-bounce">
                {incoming.callType === "video" ? (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                )}
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                Incoming {incoming.callType} call
              </h3>
              <p className="text-slate-300 text-lg font-medium">{callerName}</p>
            </div>

            {/* Action buttons */}
            <div className="p-8">
              <div className="flex items-center justify-center gap-6">
                {/* Accept button */}
                <button
                  className="group relative w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 transition-all duration-300 transform hover:scale-110 active:scale-95"
                  onClick={acceptIncoming}
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                </button>

                {/* Decline button */}
                <button
                  className="group relative w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 transition-all duration-300 transform hover:scale-110 active:scale-95"
                  onClick={rejectIncoming}
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.5 1.5M21 21l-1.5-1.5M3 21l1.5-1.5M21 3l-1.5 1.5" />
                  </svg>
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-rose-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                </button>

                {/* Dismiss button */}
                <button
                  className="group relative w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-500/20 transition-all duration-300 transform hover:scale-110 active:scale-95"
                  onClick={() => setIncoming(null)}
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <div className="absolute -inset-1 bg-gradient-to-r from-slate-500 to-slate-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                </button>
              </div>

              {/* Action labels */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <span className="text-green-400 text-sm font-medium">Accept</span>
                <span className="text-red-400 text-sm font-medium">Decline</span>
                <span className="text-slate-400 text-sm font-medium">Dismiss</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active call modal */}
      {activeCall && (
        <CallModal
          isOpen={true}
          onClose={() => setActiveCall(null)}
          conversationId={activeCall.conversationId}
          callType={activeCall.callType}
          isCaller={activeCall.isCaller}
        />
      )}
    </>
  );
};

export default GlobalCallManager;