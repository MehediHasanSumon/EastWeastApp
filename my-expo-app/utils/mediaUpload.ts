import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { Platform, Alert } from 'react-native';
import { chatSocketService } from './chatSocket';
import { getAccessToken } from './authStorage';
import { ENV } from '../config/environment';

export interface MediaFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  mimeType?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
  messageType?: 'image' | 'file' | 'voice';
}

export class MediaUploadService {
  private static instance: MediaUploadService;
  private recording: Audio.Recording | null = null;
  private isRecording = false;

  static getInstance(): MediaUploadService {
    if (!MediaUploadService.instance) {
      MediaUploadService.instance = new MediaUploadService();
    }
    return MediaUploadService.instance;
  }

  // Request permissions for camera and media library
  async requestPermissions(): Promise<boolean> {
    try {
      // Check if user is authenticated first
      const token = await this.getAuthToken();
      if (!token) {
        Alert.alert(
          'Authentication Required',
          'Please log in to use media features.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const audioPermission = await Audio.requestPermissionsAsync();

      if (
        cameraPermission.status === 'granted' &&
        mediaLibraryPermission.status === 'granted' &&
        audioPermission.status === 'granted'
      ) {
        return true;
      }

      Alert.alert(
        'Permissions Required',
        'Camera, media library, and microphone permissions are required to use these features.',
        [{ text: 'OK' }]
      );
      return false;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Pick image from camera or gallery
  async pickImage(source: 'camera' | 'gallery'): Promise<MediaFile | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: 'image',
          size: asset.fileSize || 0,
          mimeType: 'image/jpeg',
        };
      }
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      return null;
    }
  }

  // Pick document/file
  async pickDocument(): Promise<MediaFile | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          name: asset.name || `file_${Date.now()}`,
          type: 'file',
          size: asset.size || 0,
          mimeType: asset.mimeType || 'application/octet-stream',
        };
      }
      return null;
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
      return null;
    }
  }

  // Start voice recording
  async startVoiceRecording(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.recording = new Audio.Recording();
      await this.recording.startAsync();
      this.isRecording = true;

      return true;
    } catch (error) {
      console.error('Error starting voice recording:', error);
      Alert.alert('Error', 'Failed to start voice recording');
      return false;
    }
  }

  // Stop voice recording
  async stopVoiceRecording(): Promise<MediaFile | null> {
    try {
      if (!this.recording || !this.isRecording) return null;

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();

      this.isRecording = false;
      this.recording = null;

      if (uri && status.durationMillis) {
        return {
          uri,
          name: `voice_${Date.now()}.m4a`,
          type: 'voice',
          size: 0, // Size will be determined after file creation
          mimeType: 'audio/m4a',
        };
      }
      return null;
    } catch (error) {
      console.error('Error stopping voice recording:', error);
      Alert.alert('Error', 'Failed to stop voice recording');
      return null;
    }
  }

  // Check if currently recording
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  // Upload media file to server
  async uploadMedia(
    file: MediaFile,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Validate file size for production
      if (file.size > ENV.MAX_FILE_SIZE) {
        const maxSizeMB = ENV.MAX_FILE_SIZE / (1024 * 1024);
        throw new Error(`File size too large. Maximum allowed: ${maxSizeMB}MB`);
      }

      // Create FormData for upload
      const formData = new FormData();
      
      // Validate file type for production
      if (file.type === 'image' && !ENV.SUPPORTED_IMAGE_TYPES.includes(file.mimeType || 'image/jpeg')) {
        throw new Error('Unsupported image format. Supported: JPEG, PNG, WebP');
      } else if (file.type === 'voice' && !ENV.SUPPORTED_AUDIO_TYPES.includes(file.mimeType || 'audio/m4a')) {
        throw new Error('Unsupported audio format. Supported: M4A, MP3, WAV');
      }

      // Determine the correct file type for React Native
      let fileType = file.mimeType || 'application/octet-stream';
      if (file.type === 'image') {
        fileType = 'image/jpeg';
      } else if (file.type === 'voice') {
        fileType = 'audio/m4a';
      }

      // Create file object for FormData
      const fileObj = {
        uri: file.uri,
        type: fileType,
        name: file.name,
      } as any;

      formData.append('file', fileObj);

      // Make upload request with timeout for production
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ENV.API_TIMEOUT);
      
      try {
        const response = await fetch(`${this.getApiUrl()}/api/chat/media`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await this.getAuthToken()}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed:', response.status, errorText);
          throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          return {
            success: true,
            url: result.data.url,
            fileName: result.data.fileName,
            fileSize: result.data.fileSize,
            messageType: result.data.messageType,
          };
        } else {
          throw new Error(result.message || 'Upload failed');
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Upload timeout - request took too long');
        }
        throw error;
      }
    } catch (error) {
      console.error('Media upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Send media message via socket
  async sendMediaMessage(
    conversationId: string,
    mediaFile: MediaFile,
    replyTo?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<boolean> {
    try {
      // Upload media first
      const uploadResult = await this.uploadMedia(mediaFile, onProgress);
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Send message via socket
      const messageData = {
        conversationId,
        content: mediaFile.type === 'image' ? '📷 Image' : 
                mediaFile.type === 'voice' ? '🎤 Voice message' : 
                '📎 File',
        messageType: uploadResult.messageType || 'file',
        mediaUrl: uploadResult.url,
        fileName: uploadResult.fileName || mediaFile.name,
        fileSize: uploadResult.fileSize || mediaFile.size,
        replyTo,
      };

      const result = await chatSocketService.sendMessage(messageData);
      if (!result.success) {
        console.error('Socket message failed:', result.error);
        throw new Error(result.error || 'Failed to send message via socket');
      }
      return result.success;
    } catch (error) {
      console.error('Error sending media message:', error);
      Alert.alert('Error', 'Failed to send media message');
      return false;
    }
  }

  // Get API URL
  private getApiUrl(): string {
    return ENV.BACKEND_HOST;
  }

  // Get auth token
  private async getAuthToken(): Promise<string> {
    const token = await getAccessToken();
    return token || '';
  }

  // Cleanup resources
  cleanup() {
    if (this.recording && this.isRecording) {
      this.recording.stopAndUnloadAsync();
      this.isRecording = false;
      this.recording = null;
    }
  }
}

export const mediaUploadService = MediaUploadService.getInstance();
