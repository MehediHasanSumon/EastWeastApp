import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeReady } from '../../context/ThemeContext';
import { ChatMessage } from '../../types/chat';

interface ChatInputProps {
  messageText: string;
  onMessageChange: (text: string) => void;
  onSendMessage: () => void;
  onImagePicker: () => void;
  onDocumentPicker: () => void;
  isSending: boolean;
  inputHeightAnim: Animated.Value;
  sendButtonScaleAnim: Animated.Value;
  replyToMessage?: ChatMessage | null;
  onCancelReply?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  messageText,
  onMessageChange,
  onSendMessage,
  onImagePicker,
  onDocumentPicker,
  isSending,
  inputHeightAnim,
  sendButtonScaleAnim,
  replyToMessage,
  onCancelReply,
}) => {
  const isThemeReady = useThemeReady();
  
  // Don't render until theme is ready
  if (!isThemeReady) {
    return null;
  }
  
  const { theme } = useTheme();

  return (
    <View style={[styles.inputContainer, { backgroundColor: theme.mode === 'dark' ? '#1A1A1A' : '#FFFFFF' }]}>
      {/* Reply Preview */}
      {replyToMessage && (
        <View style={[styles.replyPreview, { backgroundColor: theme.mode === 'dark' ? '#2A2A2A' : '#F0F2F5' }]}>
          <View style={[styles.replyLine, { backgroundColor: '#0084FF' }]} />
          <View style={styles.replyContent}>
            <Text style={[styles.replySender, { color: theme.fontColor + 'CC' }]}>
              {replyToMessage.sender.name}
            </Text>
            <Text style={[styles.replyText, { color: theme.fontColor + '99' }]} numberOfLines={1}>
              {replyToMessage.isDeleted ? 'This message was deleted' : replyToMessage.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelReplyButton}>
            <Ionicons name="close" size={20} color={theme.fontColor + '66'} />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputWrapper}>
        <View style={styles.inputActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]} 
            onPress={onDocumentPicker}
          >
            <Ionicons name="add" size={20} color="#0084FF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]} 
            onPress={onImagePicker}
          >
            <Ionicons name="camera" size={20} color="#0084FF" />
          </TouchableOpacity>
        </View>
        
        <Animated.View style={[
          styles.textInputContainer, 
          { 
            backgroundColor: theme.mode === 'dark' ? '#2A2A2A' : '#FFFFFF',
            height: inputHeightAnim,
            borderWidth: 1,
            borderColor: theme.mode === 'dark' ? '#3A3B3C' : '#E4E6EB',
          }
        ]}>
          <TextInput
            style={[styles.textInput, { color: theme.fontColor }]}
            value={messageText}
            onChangeText={onMessageChange}
            placeholder="Type a message..."
            placeholderTextColor={theme.fontColor + '66'}
            multiline
            maxLength={1000}
          />
        </Animated.View>
        
        <Animated.View style={[styles.sendButtonWrapper, { transform: [{ scale: sendButtonScaleAnim }] }]}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: messageText.trim() 
                  ? '#0084FF' 
                  : (theme.mode === 'dark' ? '#3A3B3C' : '#E4E6EB')
              }
            ]}
            onPress={onSendMessage}
            disabled={!messageText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : messageText.trim() ? (
              <Ionicons name="send" size={16} color="#fff" />
            ) : (
              <Ionicons name="mic" size={16} color={theme.fontColor + '66'} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0084FF',
  },
  replyLine: {
    width: 3,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
    marginRight: 8,
  },
  replySender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 14,
    fontWeight: '400',
  },
  cancelReplyButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
    textAlignVertical: 'center',
    padding: 0,
    margin: 0,
  },
  sendButtonWrapper: {
    // Wrapper for send button animation
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default ChatInput;
