import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Mic, 
  MicOff, 
  Paperclip, 
  Image as ImageIcon, 
  Smile, 
  Send, 
  X,
  Upload,
  File,
  Volume2
} from "lucide-react";
import { ChatService } from "../../service/chatService";

interface MessageInputProps {
  onSendMessage: (content: string, messageType?: string, mediaUrl?: string, durationSeconds?: number) => void;
  onTyping: (value: string) => void;
  placeholder?: string;
  replyTo?: { id: string; preview: string } | null;
  onCancelReply?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  placeholder = "Type a message...",
  // replyTo, // reserved for future in-input rendering
  onCancelReply,
}) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingVoice, setPendingVoice] = useState<{ blob: Blob; file: File; url: string; duration: number } | null>(null);
  const [isStopping, setIsStopping] = useState(false);

  const emojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
    "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
    "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
    "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😯", "😦", "😧",
    "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢",
    "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "💩", "👻", "💀",
    "☠️", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽",
    "🙀", "😿", "😾", "🙈", "🙉", "🙊", "👶", "👧", "🧒", "👦",
    "👩", "🧑", "👨", "👵", "🧓", "👴", "👮‍♀️", "👮", "👮‍♂️", "🕵️‍♀️",
    "🕵️", "🕵️‍♂️", "💂‍♀️", "💂", "💂‍♂️", "👷‍♀️", "👷", "👷‍♂️", "🤴", "👸",
    "👳‍♀️", "👳", "👳‍♂️", "👲", "🧕", "🤵", "👰", "🤰", "🤱", "👼",
    "🎅", "🤶", "🧙‍♀️", "🧙", "🧙‍♂️", "🧝‍♀️", "🧝", "🧝‍♂️", "🧛‍♀️", "🧛",
    "🧛‍♂️", "🧟‍♀️", "🧟", "🧟‍♂️", "🧞‍♀️", "🧞", "🧞‍♂️", "🧜‍♀️", "🧜", "🧜‍♂️",
    "🧚‍♀️", "🧚", "🧚‍♂️", "👼", "🤰", "🤱", "👼", "🎅", "🤶", "🧙‍♀️", "🧙",
  ];

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setMessage("");
    onTyping("");
    if (onCancelReply) onCancelReply();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") {
      e.preventDefault();
      handleSend();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    onTyping(value);
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // If it is an image, hand over to image flow for preview
    if (file.type.startsWith("image/")) {
      try {
        const previewUrl = URL.createObjectURL(file);
        setPendingImage(file);
        setPendingImagePreview(previewUrl);
        setShowEmojiPicker(false);
      } catch (err) {
        console.error("Image preview failed", err);
      }
      return;
    }
    setPendingFile(file);
    setShowEmojiPicker(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const previewUrl = URL.createObjectURL(file);
      setPendingImage(file);
      setPendingImagePreview(previewUrl);
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Image preview failed", err);
    }
  };

  const clearPendingImage = () => {
    try { if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview); } catch {}
    setPendingImage(null);
    setPendingImagePreview(null);
  };

  const sendPendingImage = async () => {
    if (!pendingImage) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const uploaded = await ChatService.uploadMedia(pendingImage, (p) => setUploadProgress(p));
      onSendMessage(message.trim(), "image", uploaded.url);
      setMessage("");
      clearPendingImage();
    } catch (err) {
      console.error("Image upload failed", err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const clearPendingFile = () => {
    setPendingFile(null);
  };

  const sendPendingFile = async () => {
    if (!pendingFile) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const uploaded = await ChatService.uploadMedia(pendingFile, (p) => setUploadProgress(p));
      onSendMessage(uploaded.fileName || "", uploaded.messageType, uploaded.url);
    } catch (err) {
      console.error("File upload failed", err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      clearPendingFile();
    }
  };

  const sendPendingVoice = async () => {
    if (!pendingVoice) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const uploaded = await ChatService.uploadMedia(pendingVoice.file, (p) => setUploadProgress(p));
      onSendMessage("", "voice", uploaded.url, pendingVoice.duration);
    } catch (e) {
      console.error("Voice upload failed", e);
      toast.error("Failed to upload voice clip");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      try { URL.revokeObjectURL(pendingVoice.url); } catch {}
      setPendingVoice(null);
    }
  };

  // Voice recording controls
  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Choose a broadly supported mime type with graceful fallback
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        // Some Safari versions may support mp4/aac via MediaRecorder
        "audio/mp4",
        "audio/aac",
      ];
      const mimeType = preferredTypes.find((t) => (window as any).MediaRecorder && MediaRecorder.isTypeSupported(t)) || "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        // Stop tracks
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const fileExt = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") || mimeType.includes("aac") ? "m4a" : "webm";
        const file = new window.File([blob], `voice-${Date.now()}.${fileExt}`, { type: mimeType } as any);
        const playbackUrl = URL.createObjectURL(blob);

        // Compute accurate duration from metadata; fallback to timer
        const computedDuration = await new Promise<number>((resolve) => {
          const audioEl = document.createElement("audio");
          audioEl.preload = "metadata";
          audioEl.src = playbackUrl;
          const cleanup = () => {
            audioEl.removeAttribute("src");
            try { audioEl.load(); } catch {}
          };
          audioEl.onloadedmetadata = () => {
            let dur = audioEl.duration;
            if (!isFinite(dur) || dur === Infinity) {
              // Safari workaround
              audioEl.currentTime = 1e7;
              audioEl.ontimeupdate = () => {
                audioEl.ontimeupdate = null;
                dur = audioEl.duration;
                cleanup();
                resolve(isFinite(dur) ? dur : recordingSeconds);
              };
            } else {
              cleanup();
              resolve(dur);
            }
          };
          audioEl.onerror = () => {
            cleanup();
            resolve(recordingSeconds);
          };
        });

        // Enforce minimal duration to avoid accidental taps
        if ((computedDuration || recordingSeconds) < 0.5) {
          try { URL.revokeObjectURL(playbackUrl); } catch {}
          setIsRecording(false);
          setRecordingSeconds(0);
          if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
          setIsStopping(false);
          toast("Voice clip too short");
          return;
        }

        setPendingVoice({ blob, file, url: playbackUrl, duration: Math.round((computedDuration || recordingSeconds) * 10) / 10 });
        setIsRecording(false);
        setRecordingSeconds(0);
        if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
        setIsStopping(false);
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = window.setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error("Microphone permission or init failed", err);
      toast.error("Microphone not available or permission denied");
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    try {
      setIsStopping(true);
      mediaRecorderRef.current?.stop();
    } catch {}
  };

  const cancelRecording = () => {
    if (!isRecording) return;
    try {
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    } catch {}
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
  };

  useEffect(() => {
    return () => {
      try { mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop()); } catch {}
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      {pendingImagePreview && (
        <div className="mb-4 p-4 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 backdrop-blur-sm shadow-lg">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img src={pendingImagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl shadow-md" />
              <div className="absolute inset-0 bg-black/5 rounded-xl"></div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-3 font-medium">Image preview • Add a caption below</div>
              {isUploading && (
                <div className="w-full h-2 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-3 overflow-hidden">
                  <div 
                    className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }} 
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={sendPendingImage}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400 shadow-md hover:shadow-lg transform hover:scale-105 disabled:scale-100 transition-all duration-200 flex items-center gap-2"
                >
                  <Upload size={16} />
                  Send image
                </button>
                <button
                  onClick={clearPendingImage}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-60 transition-all duration-200 flex items-center gap-2"
                >
                  <X size={16} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingFile && (
        <div className="mb-4 p-4 border border-amber-200/50 dark:border-amber-800/50 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/20 backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                <File className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate max-w-[220px]">{pendingFile.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{(pendingFile.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
            <div className="min-w-[200px]">
              {isUploading && (
                <div className="w-full h-2 bg-amber-100 dark:bg-amber-900/50 rounded-full mb-2 overflow-hidden">
                  <div 
                    className="h-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }} 
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={sendPendingFile} 
                  disabled={isUploading} 
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 disabled:from-amber-300 disabled:to-amber-400 shadow-md hover:shadow-lg transform hover:scale-105 disabled:scale-100 transition-all duration-200 flex items-center gap-2"
                >
                  <Upload size={16} />
                  Send file
                </button>
                <button 
                  onClick={clearPendingFile} 
                  disabled={isUploading} 
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-60 transition-all duration-200 flex items-center gap-2"
                >
                  <X size={16} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingVoice && (
        <div className="mb-4 p-4 border border-green-200/50 dark:border-green-800/50 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-xl">
                <Volume2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <audio src={pendingVoice.url} controls className="w-60" />
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-lg">{pendingVoice.duration}s</span>
            </div>
            <div className="min-w-[200px]">
              {isUploading && (
                <div className="w-full h-2 bg-green-100 dark:bg-green-900/50 rounded-full mb-2 overflow-hidden">
                  <div 
                    className="h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }} 
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={sendPendingVoice}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-400 shadow-md hover:shadow-lg transform hover:scale-105 disabled:scale-100 transition-all duration-200 flex items-center gap-2"
                >
                  <Upload size={16} />
                  Send voice
                </button>
                <button
                  onClick={() => { try { URL.revokeObjectURL(pendingVoice.url); } catch {}; setPendingVoice(null); }}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-60 transition-all duration-200 flex items-center gap-2"
                >
                  <X size={16} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-xl p-4 z-10 max-h-48 overflow-y-auto backdrop-blur-sm">
          <div className="grid grid-cols-10 gap-1">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-lg transition-all duration-200 transform hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end space-x-3 bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-3 shadow-lg backdrop-blur-sm">
        {/* Voice mic toggle only; sending is performed from the voice preview above */}
        <button
          onClick={() => (isRecording ? stopRecording() : startRecording())}
          className={`p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
            isRecording 
              ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25" 
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title={isRecording ? (isStopping ? "Finishing..." : "Stop recording") : "Record voice"}
          disabled={isStopping}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* File upload button */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 transform hover:scale-105"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>
        </div>

        {/* Image upload button */}
        <div className="relative">
          <input
            ref={imageInputRef}
            type="file"
            onChange={handleImageSelect}
            className="hidden"
            accept="image/*"
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 transform hover:scale-105"
            title="Attach image"
          >
            <ImageIcon size={20} />
          </button>
        </div>

        {/* Emoji button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 transform hover:scale-105"
          title="Add emoji"
        >
          <Smile size={20} />
        </button>

        {/* Message input */}
        <div className="flex-1 relative">
          {!isRecording ? (
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            rows={1}
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          ) : (
            <div className="w-full px-4 py-3 border border-red-300 dark:border-red-700 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/20 rounded-xl flex items-center justify-between backdrop-blur-sm">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></span>
                <span className="font-semibold">Recording...</span>
                <span className="text-sm bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded-lg">{recordingSeconds}s</span>
              </div>
              <button 
                onClick={cancelRecording} 
                className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all duration-200 flex items-center gap-1"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Send text button (hidden when a voice clip is pending to avoid confusion) */}
        {!isRecording && !pendingImage && !pendingVoice && (
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none"
          title="Send message"
        >
          <Send size={20} />
        </button>
        )}
      </div>

      {/* Click outside to close emoji picker */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};

export default MessageInput;