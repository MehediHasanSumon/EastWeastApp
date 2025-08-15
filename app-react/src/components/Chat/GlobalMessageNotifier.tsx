import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import chatSocketService from "../../socket/chatSocket";
import { fetchConversation, fetchMessages, setCurrentConversation } from "../../app/features/chat/chatSlice";
import type { AppDispatch, RootState } from "../../app/Store";

const GlobalMessageNotifier: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s: RootState) => s.auth);
  const { currentConversation } = useSelector((s: RootState) => s.chat);

  const toneCtxRef = useRef<AudioContext | null>(null);
  const toneOscRef = useRef<OscillatorNode | null>(null);
  const toneGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!user) return;

    const onNewMessage = (message: any) => {
      const uid = user?.id || (user as any)?._id;
      if (!uid) return;
      if (message?.sender?._id === uid) return; // ignore own messages

      const isOnMessenger = location.pathname.startsWith("/messenger");
      const isViewingThisConversation = isOnMessenger && currentConversation?._id === message?.conversationId;
      const isWindowFocused = typeof document !== "undefined" ? document.hasFocus() : true;

      // If user is actively viewing this conversation and window focused, don't duplicate toast
      if (isViewingThisConversation && isWindowFocused) return;

      // Play a short notification tone
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = 750; // short chirp
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        setTimeout(() => {
          try { osc.stop(); ctx.close(); } catch {}
        }, 300);
        toneCtxRef.current = ctx; toneOscRef.current = osc; toneGainRef.current = gain;
      } catch {}

      const senderName = message?.sender?.name || "Someone";
      const convId = message?.conversationId;

      toast((t) => (
        <div className="flex items-start gap-3">
          <div className="text-xl">💬</div>
          <div className="flex-1">
            <div className="font-semibold">New message from {senderName}</div>
            <div className="text-sm text-gray-600 truncate max-w-[260px]">{message?.content || message?.messageType}</div>
            <div className="mt-2 flex gap-2">
              <button
                className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={async () => {
                  try {
                    if (convId) {
                      const conv = await dispatch(fetchConversation(convId)).unwrap();
                      await dispatch(fetchMessages({ conversationId: convId }));
                      dispatch(setCurrentConversation(conv));
                    }
                  } catch {}
                  navigate("/messenger");
                  toast.dismiss(t.id);
                }}
              >
                Open
              </button>
              <button
                className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => toast.dismiss(t.id)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ), { duration: 4000, position: "bottom-right" });
    };

    // Ensure socket is connected globally
    try { if (!chatSocketService.getConnectionStatus()) chatSocketService.connect(); } catch {}
    chatSocketService.on("new_message", onNewMessage);
    return () => {
      chatSocketService.off("new_message", onNewMessage);
      // stop tone if any lingering
      try { toneOscRef.current?.stop(); toneCtxRef.current?.close(); } catch {}
      toneCtxRef.current = null; toneOscRef.current = null; toneGainRef.current = null;
    };
  }, [user, location.pathname, currentConversation?._id, dispatch, navigate]);

  return null;
};

export default GlobalMessageNotifier;


