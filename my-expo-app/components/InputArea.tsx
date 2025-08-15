import { Entypo, FontAwesome, Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Attachment } from '../types/types';
import AttachmentPreview from './AttachmentPreview';

type InputAreaProps = {
  message: string;
  setMessage: (text: string) => void;
  sendMessage: () => void;
  pickImage: () => void;
  takePhoto: () => void;
  pickDocument: () => void;
  isUploading: boolean;
  attachments: Attachment[];
  setAttachments: (attachments: Attachment[]) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
};

const InputArea = ({
  message,
  setMessage,
  sendMessage,
  pickImage,
  takePhoto,
  pickDocument,
  isUploading,
  attachments,
  setAttachments,
  isRecording,
  startRecording,
  stopRecording,
}: InputAreaProps) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      className="w-full border-t border-gray-200 bg-white px-3 py-2">
      {/* Attachment Preview Section */}
      {attachments.length > 0 && (
        <View className="mb-2">
          <AttachmentPreview attachments={attachments} setAttachments={setAttachments} />
        </View>
      )}

      {/* Message Input Row */}
      <View className="flex-row items-end space-x-2">
        {/* Attach Button */}
        <TouchableOpacity onPress={pickDocument} className="p-2">
          <Entypo name="attachment" size={24} color="#1877f2" />
        </TouchableOpacity>

        {/* Message Input Box */}
        <View className="flex-1 flex-row items-center rounded-full bg-gray-100 px-4">
          <TextInput
            className="flex-1 py-2 text-base"
            placeholder="Type a message..."
            placeholderTextColor="#65676b"
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={sendMessage}
            multiline
          />

          {/* Microphone */}
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
            className="ml-2">
            {isRecording ? (
              <Ionicons name="stop-circle" size={24} color="#ff3b30" />
            ) : (
              <Ionicons name="mic-outline" size={24} color="#1877f2" />
            )}
          </TouchableOpacity>
        </View>

        {/* Right Buttons */}
        {message ? (
          <TouchableOpacity
            onPress={sendMessage}
            disabled={isUploading}
            className={`h-10 w-10 items-center justify-center rounded-full ${
              isUploading ? 'bg-blue-300' : 'bg-blue-600'
            }`}>
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesome name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={pickImage} className="h-10 w-10 items-center justify-center">
              <FontAwesome name="photo" size={20} color="#1877f2" />
            </TouchableOpacity>
            <TouchableOpacity onPress={takePhoto} className="h-10 w-10 items-center justify-center">
              <FontAwesome name="camera" size={20} color="#1877f2" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default InputArea;
