import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';
import { mediaUploadService, MediaFile, UploadProgress } from '../utils/mediaUpload';
import { ChatMessage } from '../types/chat';

const { width } = Dimensions.get('window');

interface EnhancedMessageInputProps {
  conversationId: string;
  onSendMessage: (messageData: {
    content: string;
    messageType: 'text' | 'image' | 'file' | 'voice';
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    replyTo?: string;
  }) => void;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

const EnhancedMessageInput: React.FC<EnhancedMessageInputProps> = ({
  conversationId,
  onSendMessage,
  replyTo,
  onCancelReply,
  disabled = false,
}) => {
  const { theme } = useContext(ThemeContext);
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingMedia, setPendingMedia] = useState<MediaFile | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      mediaUploadService.cleanup();
    };
  }, []);

  // Start voice recording
  const startRecording = async () => {
    try {
      const success = await mediaUploadService.startVoiceRecording();
      if (success) {
        setIsRecording(true);
        setRecordingDuration(0);
        
        // Start timer for recording duration
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Stop voice recording
  const stopRecording = async () => {
    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      const voiceFile = await mediaUploadService.stopVoiceRecording();
      if (voiceFile) {
        setPendingMedia(voiceFile);
        setShowMediaOptions(false);
      }
      
      setIsRecording(false);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  // Pick image from camera
  const pickImageFromCamera = async () => {
    try {
      const imageFile = await mediaUploadService.pickImage('camera');
      if (imageFile) {
        setPendingMedia(imageFile);
        setShowMediaOptions(false);
      }
    } catch (error) {
      console.error('Failed to pick image from camera:', error);
    }
  };

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    try {
      const imageFile = await mediaUploadService.pickImage('gallery');
      if (imageFile) {
        setPendingMedia(imageFile);
        setShowMediaOptions(false);
      }
    } catch (error) {
      console.error('Failed to pick image from gallery:', error);
    }
  };

  // Pick document
  const pickDocument = async () => {
    try {
      const documentFile = await mediaUploadService.pickDocument();
      if (documentFile) {
        setPendingMedia(documentFile);
        setShowMediaOptions(false);
      }
    } catch (error) {
      console.error('Failed to pick document:', error);
    }
  };

  // Send text message
  const sendTextMessage = () => {
    if (message.trim() && !disabled) {
      onSendMessage({
        content: message.trim(),
        messageType: 'text',
        replyTo: replyTo?._id,
      });
      setMessage('');
    }
  };

  // Send media message
  const sendMediaMessage = async () => {
    if (!pendingMedia || disabled) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const success = await mediaUploadService.sendMediaMessage(
        conversationId,
        pendingMedia,
        replyTo?._id,
        (progress: UploadProgress) => {
          setUploadProgress(progress.percentage);
        }
      );

      if (success) {
        setPendingMedia(null);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Failed to send media message:', error);
      Alert.alert('Error', 'Failed to send media message');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Cancel pending media
  const cancelPendingMedia = () => {
    setPendingMedia(null);
    setUploadProgress(0);
  };

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Reply Preview */}
      {replyTo && (
        <View style={[styles.replyPreview, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
          <View style={styles.replyContent}>
            <Text style={[styles.replySender, { color: theme.fontColor }]}>
              {replyTo.sender.name}
            </Text>
            <Text style={[styles.replyText, { color: theme.fontColor + 'CC' }]} numberOfLines={1}>
              {replyTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelReplyButton}>
            <Ionicons name="close" size={20} color={theme.fontColor} />
          </TouchableOpacity>
        </View>
      )}

      {/* Pending Media Preview */}
      {pendingMedia && (
        <View style={[styles.mediaPreview, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
          <View style={styles.mediaInfo}>
            <Ionicons 
              name={pendingMedia.type === 'image' ? 'image' : 
                    pendingMedia.type === 'voice' ? 'mic' : 'document'} 
              size={24} 
              color={theme.fontColor} 
            />
            <Text style={[styles.mediaName, { color: theme.fontColor }]} numberOfLines={1}>
              {pendingMedia.name}
            </Text>
          </View>
          
          {uploading ? (
            <View style={styles.uploadProgress}>
              <ActivityIndicator size="small" color={theme.accentColor} />
              <Text style={[styles.progressText, { color: theme.fontColor }]}>
                {uploadProgress}%
              </Text>
            </View>
          ) : (
            <View style={styles.mediaActions}>
              <TouchableOpacity onPress={sendMediaMessage} style={[styles.sendButton, { backgroundColor: theme.accentColor }]}>
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelPendingMedia} style={styles.cancelButton}>
                <Ionicons name="close" size={20} color={theme.fontColor} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Main Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
        {/* Media Button */}
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={() => setShowMediaOptions(!showMediaOptions)}
          disabled={disabled}
        >
          <Ionicons name="add-circle" size={24} color={theme.accentColor} />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={[styles.textInput, { color: theme.fontColor }]}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor={theme.fontColor + '66'}
          multiline
          maxLength={1000}
          editable={!disabled}
        />

        {/* Voice Recording Button */}
        {isRecording ? (
          <TouchableOpacity
            style={[styles.voiceButton, styles.recordingButton]}
            onPress={stopRecording}
            disabled={disabled}
          >
            <Ionicons name="stop" size={24} color="#FF3B30" />
            <Text style={styles.recordingDuration}>
              {formatDuration(recordingDuration)}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={startRecording}
            disabled={disabled}
          >
            <Ionicons name="mic" size={24} color={theme.accentColor} />
          </TouchableOpacity>
        )}

        {/* Send Button */}
        {message.trim() && (
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.accentColor }]}
            onPress={sendTextMessage}
            disabled={disabled}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Media Options Modal */}
      <Modal
        visible={showMediaOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMediaOptions(false)}
      >
        <TouchableOpacity
          style={styles.mediaOverlay}
          onPress={() => setShowMediaOptions(false)}
          activeOpacity={1}
        >
          <View style={[styles.mediaOptions, { backgroundColor: theme.mode === 'dark' ? '#242526' : '#FFFFFF' }]}>
            <Text style={[styles.mediaOptionsTitle, { color: theme.fontColor }]}>
              Choose Media Type
            </Text>
            
            <View style={styles.mediaOptionsGrid}>
              <TouchableOpacity
                style={styles.mediaOption}
                onPress={pickImageFromCamera}
              >
                <View style={[styles.mediaOptionIcon, { backgroundColor: '#4CAF50' }]}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
                <Text style={[styles.mediaOptionText, { color: theme.fontColor }]}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaOption}
                onPress={pickImageFromGallery}
              >
                <View style={[styles.mediaOptionIcon, { backgroundColor: '#2196F3' }]}>
                  <Ionicons name="images" size={24} color="#fff" />
                </View>
                <Text style={[styles.mediaOptionText, { color: theme.fontColor }]}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaOption}
                onPress={pickDocument}
              >
                <View style={[styles.mediaOptionIcon, { backgroundColor: '#FF9800' }]}>
                  <Ionicons name="document" size={24} color="#fff" />
                </View>
                <Text style={[styles.mediaOptionText, { color: theme.fontColor }]}>Document</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaOption}
                onPress={startRecording}
              >
                <View style={[styles.mediaOptionIcon, { backgroundColor: '#9C27B0' }]}>
                  <Ionicons name="mic" size={24} color="#fff" />
                </View>
                <Text style={[styles.mediaOptionText, { color: theme.fontColor }]}>Voice</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.cancelMediaButton, { borderColor: theme.fontColor + '30' }]}
              onPress={() => setShowMediaOptions(false)}
            >
              <Text style={[styles.cancelMediaText, { color: theme.fontColor }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0084FF',
  },
  replyContent: {
    flex: 1,
    marginRight: 8,
  },
  replySender: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
  },
  cancelReplyButton: {
    padding: 4,
  },
  mediaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  mediaInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  mediaName: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    marginLeft: 8,
  },
  mediaActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  mediaButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  voiceButton: {
    padding: 8,
    marginLeft: 8,
  },
  recordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDuration: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
    fontWeight: '600',
  },
  mediaOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  mediaOptions: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  mediaOptionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  mediaOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mediaOption: {
    width: (width - 80) / 2,
    alignItems: 'center',
    marginBottom: 20,
  },
  mediaOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelMediaButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelMediaText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EnhancedMessageInput;
