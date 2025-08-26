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
import { ThemeContext } from '../../context/ThemeContext';
import { useContext } from 'react';
import { IMessage } from '../../types/chat';

const { width } = Dimensions.get('window');

interface MessageInputProps {
  onSendMessage: (content: string, messageType?: string, mediaUrl?: string, durationSeconds?: number) => void;
  onTyping: (value: string) => void;
  placeholder?: string;
  replyTo?: { id: string; preview: string } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  placeholder = "Type a message...",
  replyTo,
  onCancelReply,
  disabled = false,
}) => {
  const { theme } = useContext(ThemeContext);
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (replyTo) {
      inputRef.current?.focus();
    }
  }, [replyTo]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(message.trim(), 'text');
      setMessage('');
      onTyping('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setMessage(text);
    onTyping(text);
  };

  const handleAttachment = (type: 'image' | 'file' | 'camera') => {
    setShowAttachmentMenu(false);
    // TODO: Implement file/image picker
    Alert.alert('Coming Soon', `${type} attachment feature will be available soon`);
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // TODO: Implement voice recording stop
    } else {
      // Start recording
      setIsRecording(true);
      // TODO: Implement voice recording start
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '😎', '🤔', '😢', '😡', '🥳', '🤗', '😴', '🤫'];

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.bgColor, borderTopColor: theme.bgColor }
    ]}>
      {/* Reply Preview */}
      {replyTo && (
        <View style={[
          styles.replyContainer,
          { backgroundColor: theme.bgColor, borderColor: theme.bgColor }
        ]}>
          <View style={styles.replyContent}>
            <Text style={[styles.replyLabel, { color: theme.fontColor }]}>
              Replying to:
            </Text>
            <Text style={[styles.replyPreview, { color: theme.fontColor + '80' }]} numberOfLines={1}>
              {replyTo.preview}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelReply}>
            <Ionicons name="close" size={20} color={theme.fontColor} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Container */}
      <View style={styles.inputContainer}>
        {/* Attachment Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowAttachmentMenu(true)}
          disabled={disabled}
        >
          <Ionicons name="add-circle" size={24} color={theme.fontColor} />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            {
              backgroundColor: theme.bgColor,
              color: theme.fontColor,
              borderColor: theme.bgColor,
            }
          ]}
          value={message}
          onChangeText={handleTyping}
          placeholder={placeholder}
          placeholderTextColor={theme.fontColor + '60'}
          multiline
          maxLength={1000}
          editable={!disabled}
        />

        {/* Emoji Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowEmojiPicker(true)}
          disabled={disabled}
        >
          <Ionicons name="happy" size={24} color={theme.fontColor} />
        </TouchableOpacity>

        {/* Voice Record Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isRecording && styles.recordingButton
          ]}
          onPress={handleVoiceRecord}
          disabled={disabled}
        >
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={24} 
            color={isRecording ? "#ff4444" : theme.fontColor} 
          />
        </TouchableOpacity>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: message.trim() ? '#0084FF' : theme.bgColor,
              borderColor: message.trim() ? '#0084FF' : theme.bgColor,
            }
          ]}
          onPress={handleSendMessage}
          disabled={!message.trim() || isSending || disabled}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color={message.trim() ? "#fff" : theme.fontColor} />
          )}
        </TouchableOpacity>
      </View>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEmojiPicker(false)}
        >
          <View style={[
            styles.emojiPicker,
            { backgroundColor: theme.bgColor, borderColor: theme.bgColor }
          ]}>
            <ScrollView contentContainerStyle={styles.emojiGrid}>
              {emojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emojiButton}
                  onPress={() => handleEmojiSelect(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Attachment Menu Modal */}
      <Modal
        visible={showAttachmentMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachmentMenu(false)}
        >
          <View style={[
            styles.attachmentMenu,
            { backgroundColor: theme.bgColor, borderColor: theme.bgColor }
          ]}>
            <TouchableOpacity
              style={styles.attachmentOption}
              onPress={() => handleAttachment('camera')}
            >
              <Ionicons name="camera" size={24} color={theme.fontColor} />
              <Text style={[styles.attachmentText, { color: theme.fontColor }]}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.attachmentOption}
              onPress={() => handleAttachment('image')}
            >
              <Ionicons name="image" size={24} color={theme.fontColor} />
              <Text style={[styles.attachmentText, { color: theme.fontColor }]}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.attachmentOption}
              onPress={() => handleAttachment('file')}
            >
              <Ionicons name="document" size={24} color={theme.fontColor} />
              <Text style={[styles.attachmentText, { color: theme.fontColor }]}>Document</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyPreview: {
    fontSize: 14,
  },
  cancelReply: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  sendButton: {
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  emojiPicker: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: 300,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  emojiButton: {
    padding: 12,
    margin: 4,
  },
  emojiText: {
    fontSize: 24,
  },
  attachmentMenu: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  attachmentText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MessageInput;
