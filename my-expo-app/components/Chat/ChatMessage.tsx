import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useThemeReady } from '../../context/ThemeContext';
import { ChatMessage as ChatMessageType, ChatUser } from '../../types/chat';
import MessageReactions from '../MessageReactions';
import Avatar from '../Avatar';

const { width, height } = Dimensions.get('window');

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
  messages: ChatMessageType[];
  currentUser: ChatUser | null;
  onLongPress: (message: ChatMessageType) => void;
  onReactionPress: (emoji: string, messageId: string) => void;
  onReactionLongPress: (emoji: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  index,
  messages,
  currentUser,
  onLongPress,
  onReactionPress,
  onReactionLongPress,
}) => {
  const isThemeReady = useThemeReady();
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Don't render until theme is ready
  if (!isThemeReady) {
    return null;
  }
  
  const { theme } = useTheme();

  const isOwnMessage = message.sender._id === currentUser?._id;
  const prevMessage = index > 0 ? messages[index - 1] : null;
  const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
  
  const showAvatar = !isOwnMessage && (!nextMessage || nextMessage.sender._id !== message.sender._id);
  const showSenderName = !isOwnMessage && (!prevMessage || prevMessage.sender._id !== message.sender._id);
  const isLastInGroup = !nextMessage || nextMessage.sender._id !== message.sender._id;
  const isFirstInGroup = !prevMessage || prevMessage.sender._id !== message.sender._id;

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if URL is an image
  const isImageUrl = (url?: string): boolean => {
    if (!url) return false;
    try {
      const lowerUrl = url.toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'].some(ext => lowerUrl.includes(ext));
    } catch {
      return false;
    }
  };

  // Get display name for files
  const getDisplayName = (): string => {
    return message.fileName || message.content || 'file';
  };

  // Handle image press to open modal
  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  // Render image content
  const renderImageContent = (imageUrl: string, isOwn: boolean) => {
    return (
      <View style={styles.imageContainer}>
        <TouchableOpacity
          onPress={() => handleImagePress(imageUrl)}
          activeOpacity={0.9}
          style={styles.imageWrapper}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.messageImage}
            resizeMode="cover"
            onError={() => {
              // Fallback to file icon if image fails to load
              console.log('Image failed to load:', imageUrl);
            }}
          />
          {/* Overlay only visible on press, not always blocking the image */}
          <View style={[styles.imageOverlay, { opacity: 0 }]}>
            <Ionicons 
              name="expand-outline" 
              size={20} 
              color={isOwn ? '#FFFFFF' : '#0084FF'} 
            />
          </View>
        </TouchableOpacity>
        
        {/* Image caption if exists */}
        {message.content && (
          <Text style={[
            styles.imageCaption, 
            { color: isOwn ? '#FFFFFF' : theme.fontColor }
          ]}>
            {message.content}
          </Text>
        )}
        
        {/* Download button for images */}
        <TouchableOpacity
          style={[
            styles.downloadButton,
            { backgroundColor: isOwn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 132, 255, 0.1)' }
          ]}
          onPress={() => {
            // Handle download - you can implement actual download logic here
            Alert.alert('Download', 'Download functionality can be implemented here');
          }}
        >
          <Ionicons 
            name="download-outline" 
            size={16} 
            color={isOwn ? '#FFFFFF' : '#0084FF'} 
          />
          <Text style={[
            styles.downloadText, 
            { color: isOwn ? '#FFFFFF' : '#0084FF' }
          ]}>
            Download
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render file content
  const renderFileContent = (fileUrl: string, isOwn: boolean) => {
    const isImage = isImageUrl(fileUrl);
    
    if (isImage) {
      return renderImageContent(fileUrl, isOwn);
    }

    return (
      <View style={styles.fileContainer}>
        <View style={[
          styles.fileItem, 
          { backgroundColor: isOwn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 132, 255, 0.1)' }
        ]}>
          <Ionicons 
            name="document" 
            size={20} 
            color={isOwn ? '#FFFFFF' + 'CC' : '#0084FF'} 
          />
          <View style={styles.fileInfo}>
            <Text style={[
              styles.fileName, 
              { color: isOwn ? '#FFFFFF' + 'CC' : '#0084FF' }
            ]} numberOfLines={2}>
              {getDisplayName()}
            </Text>
            {message.fileSize && (
              <Text style={[
                styles.fileSize, 
                { color: isOwn ? '#FFFFFF' + '99' : '#0084FF' + '99' }
              ]}>
                {(message.fileSize / 1024).toFixed(1)} KB
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.downloadIcon}
            onPress={() => {
              Alert.alert('Download', 'Download functionality can be implemented here');
            }}
          >
            <Ionicons 
              name="download-outline" 
              size={18} 
              color={isOwn ? '#FFFFFF' + 'CC' : '#0084FF'} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render voice message
  const renderVoiceContent = (isOwn: boolean) => {
    return (
      <View style={styles.voiceContainer}>
        <View style={styles.voiceContent}>
          <Ionicons 
            name="mic" 
            size={20} 
            color={isOwn ? '#FFFFFF' : '#0084FF'} 
          />
          <View style={styles.voiceInfo}>
            <Text style={[
              styles.voiceText, 
              { color: isOwn ? '#FFFFFF' : theme.fontColor }
            ]}>
              Voice message
            </Text>
            {message.duration && (
              <Text style={[
                styles.voiceDuration, 
                { color: isOwn ? '#FFFFFF' + 'CC' : theme.fontColor + '99' }
              ]}>
                {Math.round(message.duration)}s
              </Text>
            )}
          </View>
        </View>
        
        {/* Download button for voice */}
        {message.mediaUrl && (
          <TouchableOpacity
            style={[
              styles.downloadButton,
              { backgroundColor: isOwn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 132, 255, 0.1)' }
            ]}
            onPress={() => {
              Alert.alert('Download', 'Download functionality can be implemented here');
            }}
          >
            <Ionicons 
              name="download-outline" 
              size={16} 
              color={isOwn ? '#FFFFFF' : '#0084FF'} 
            />
            <Text style={[
              styles.downloadText, 
              { color: isOwn ? '#FFFFFF' : '#0084FF' }
            ]}>
              Download
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render video message
  const renderVideoContent = (videoUrl: string, isOwn: boolean) => {
    return (
      <View style={styles.videoContainer}>
        <TouchableOpacity
          onPress={() => handleImagePress(videoUrl)}
          activeOpacity={0.9}
          style={styles.videoWrapper}
        >
          <Image
            source={{ uri: videoUrl }}
            style={styles.messageVideo}
            resizeMode="cover"
          />
          <View style={styles.videoOverlay}>
            <Ionicons 
              name="play-circle" 
              size={40} 
              color={isOwn ? '#FFFFFF' : '#0084FF'} 
            />
          </View>
        </TouchableOpacity>
        
        {/* Video caption if exists */}
        {message.content && (
          <Text style={[
            styles.videoCaption, 
            { color: isOwn ? '#FFFFFF' : theme.fontColor }
          ]}>
            {message.content}
          </Text>
        )}
        
        {/* Download button for videos */}
        <TouchableOpacity
          style={[
            styles.downloadButton,
            { backgroundColor: isOwn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 132, 255, 0.1)' }
          ]}
          onPress={() => {
            Alert.alert('Download', 'Download functionality can be implemented here');
          }}
        >
          <Ionicons 
            name="download-outline" 
            size={16} 
            color={isOwn ? '#FFFFFF' : '#0084FF'} 
          />
          <Text style={[
            styles.downloadText, 
            { color: isOwn ? '#FFFFFF' : '#0084FF' }
          ]}>
            Download
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render message content based on type
  const renderMessageContent = () => {
    return (
      <>
        {showSenderName && (
          <View style={styles.senderInfo}>
            <Text style={[styles.senderName, { color: isOwnMessage ? '#FFFFFF' + 'CC' : theme.fontColor + 'CC' }]}>
              {message.sender.name || 'Unknown User'}
            </Text>
            {message.sender.verified && (
              <Ionicons name="checkmark-circle" size={14} color={isOwnMessage ? "#FFFFFF" : "#0084FF"} style={styles.verifiedIcon} />
            )}
          </View>
        )}
        
        <View style={[
          styles.messageContent,
          isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent
        ]}>
          {/* Reply Preview */}
          {message.replyTo && (
            <View style={[
              styles.replyPreview,
              { 
                backgroundColor: isOwnMessage 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(0, 132, 255, 0.1)',
                borderLeftColor: isOwnMessage ? '#FFFFFF' : '#0084FF'
              }
            ]}>
              <View style={[
                styles.replyLine, 
                { backgroundColor: isOwnMessage ? '#FFFFFF' : '#0084FF' }
              ]} />
              <View style={styles.replyContent}>
                <Text style={[
                  styles.replySender, 
                  { color: isOwnMessage ? '#FFFFFF' + 'CC' : theme.fontColor + 'CC' }
                ]}>
                  {message.replyTo.sender.name}
                </Text>
                <Text style={[
                  styles.replyText, 
                  { color: isOwnMessage ? '#FFFFFF' + '99' : theme.fontColor + '99' }
                ]} numberOfLines={1}>
                  {message.replyTo.isDeleted ? 'This message was deleted' : message.replyTo.content}
                </Text>
              </View>
            </View>
          )}
          
          {message.isDeleted ? (
            <Text style={[styles.deletedMessage, { color: isOwnMessage ? '#FFFFFF' + 'CC' : theme.fontColor + '99' }]}>
              <Ionicons name="remove-circle" size={14} color={isOwnMessage ? '#FFFFFF' + 'CC' : theme.fontColor + '99'} />
              {' '}This message was deleted
            </Text>
          ) : (
            <>
              {/* Text content */}
              {message.content && message.messageType === 'text' && (
                <Text style={[styles.messageText, { color: isOwnMessage ? '#FFFFFF' : theme.fontColor }]}>
                  {message.content}
                  {message.isEdited && (
                    <Text style={[styles.editedIndicator, { color: isOwnMessage ? '#FFFFFF' + 'CC' : theme.fontColor + '99' }]}>
                      {' '}(edited)
                    </Text>
                  )}
                  {/* Forward indicator */}
                  {message.isForwarded && (
                    <Text style={[styles.forwardIndicator, { color: isOwnMessage ? '#FFFFFF' + 'CC' : theme.fontColor + '99' }]}>
                      {' '}↗️ Forwarded
                    </Text>
                  )}
                </Text>
              )}

              {/* Media content based on message type */}
              {message.messageType === 'image' && message.mediaUrl && (
                renderImageContent(message.mediaUrl, isOwnMessage)
              )}

              {message.messageType === 'file' && message.mediaUrl && (
                renderFileContent(message.mediaUrl, isOwnMessage)
              )}

              {message.messageType === 'voice' && (
                renderVoiceContent(isOwnMessage)
              )}

              {message.messageType === 'video' && message.mediaUrl && (
                renderVideoContent(message.mediaUrl, isOwnMessage)
              )}

              {/* Handle case where messageType is not set but mediaUrl exists - improved logic */}
              {!message.messageType && message.mediaUrl && (
                isImageUrl(message.mediaUrl) 
                  ? renderImageContent(message.mediaUrl, isOwnMessage)
                  : renderFileContent(message.mediaUrl, isOwnMessage)
              )}

              {/* Additional fallback: if messageType is 'file' but URL is actually an image */}
              {message.messageType === 'file' && message.mediaUrl && isImageUrl(message.mediaUrl) && (
                renderImageContent(message.mediaUrl, isOwnMessage)
              )}



              {/* Legacy attachments support */}
              {message.attachments && message.attachments.length > 0 && (
                <View style={styles.attachmentContainer}>
                  {message.attachments.map((attachment, idx) => (
                    <View key={idx} style={[styles.attachmentItem, { backgroundColor: isOwnMessage ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 132, 255, 0.1)' }]}>
                      <Ionicons name="document" size={16} color={isOwnMessage ? '#FFFFFF' + 'CC' : '#0084FF'} />
                      <Text style={[styles.attachmentText, { color: isOwnMessage ? '#FFFFFF' + 'CC' : '#0084FF' }]}>
                        {attachment.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
        
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, { color: isOwnMessage ? '#FFFFFF' + 'CC' : theme.fontColor + '99' }]}>
            {formatTime(message.createdAt)}
          </Text>
          {isOwnMessage && (
            <View style={styles.messageStatus}>
              {message.status === 'sent' && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.statusIcon} />
              )}
              {message.status === 'delivered' && (
                <Ionicons name="checkmark-done" size={14} color="#FFFFFF" style={styles.statusIcon} />
              )}
              {message.status === 'read' && (
                <Ionicons name="checkmark-done" size={14} color="#00D4FF" style={styles.statusIcon} />
              )}
            </View>
          )}
        </View>
      </>
    );
  };

  return (
    <>
      <Animated.View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
          showSenderName && styles.firstMessageInGroup,
          isLastInGroup && styles.lastMessageInGroup
        ]}
      >
        <TouchableOpacity
          onLongPress={() => onLongPress(message)}
          delayLongPress={500}
          activeOpacity={0.9}
          style={styles.messageWrapper}
        >
          {showAvatar && (
            <View style={styles.avatarContainer}>
              <Avatar
                user={message.sender}
                size={28}
                showOnlineIndicator={true}
                isOnline={message.sender.online}
              />
            </View>
          )}
          
          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            showSenderName && styles.firstBubbleInGroup,
            isLastInGroup && styles.lastBubbleInGroup,
            isFirstInGroup && styles.firstBubbleInGroup,
            !showAvatar && styles.noAvatarMargin
          ]}>
            {isOwnMessage ? (
              <LinearGradient
                colors={['#0084FF', '#0066CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBubble}
              >
                {renderMessageContent()}
              </LinearGradient>
            ) : (
              <View style={styles.otherBubbleContent}>
                {renderMessageContent()}
              </View>
            )}
          </View>
          
          {/* Message Reactions - Positioned on the left */}
          <View style={styles.reactionsWrapper}>
            <MessageReactions
              message={message}
              onReactionPress={onReactionPress}
              onReactionLongPress={onReactionLongPress}
              currentUserId={currentUser?._id}
            />
          </View>
          
          {/* Edit Indicator */}
          {isOwnMessage && !message.isDeleted && (
            <View style={styles.editIndicator}>
              <Ionicons name="create-outline" size={12} color={theme.fontColor + '66'} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          
          <ScrollView 
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 1,
    maxWidth: width * 0.85,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    marginLeft: width * 0.15,
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    marginRight: width * 0.15,
  },
  firstMessageInGroup: {
    marginTop: 12,
  },
  lastMessageInGroup: {
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    borderRadius: 18,
    maxWidth: width * 0.75,
    minWidth: 60,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    elevation: 4,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  otherBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  otherBubbleContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4E6EB',
  },
  firstBubbleInGroup: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  lastBubbleInGroup: {
    // Custom radius handled by own/other bubble styles
  },
  noAvatarMargin: {
    marginLeft: 36,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  messageContent: {
    // Container for message text and attachments
  },
  ownMessageContent: {
    // Styles for own message content
  },
  otherMessageContent: {
    // Styles for other message content
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
    borderRadius: 8,
    borderLeftWidth: 2,
  },
  replyLine: {
    width: 2,
    height: 16,
    borderRadius: 1,
    marginRight: 6,
  },
  replyContent: {
    flex: 1,
  },
  replySender: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    fontWeight: '400',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  editedIndicator: {
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.8,
    fontWeight: '500',
  },
  forwardIndicator: {
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.8,
    fontWeight: '500',
  },
  deletedMessage: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
    fontWeight: '500',
  },
  editIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  attachmentContainer: {
    marginTop: 8,
    gap: 6,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  attachmentText: {
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '600',
    flex: 1,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4,
    fontWeight: '500',
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  statusIcon: {
    marginLeft: 1,
  },
  reactionsWrapper: {
    position: 'absolute',
    left: -8,
    bottom: 0,
    zIndex: 1,
  },
  modalImage: {
    width: '90%',
    height: '90%',
    borderRadius: 12,
  },
  // Additional styles for better image handling
  imageContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
  },
  messageImage: {
    width: '100%',
    height: 200, // Fixed height for images
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  imageCaption: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  downloadText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  fileContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 10,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 11,
    marginTop: 2,
  },
  downloadIcon: {
    padding: 4,
  },
  voiceContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  voiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  voiceInfo: {
    marginLeft: 10,
  },
  voiceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  voiceDuration: {
    fontSize: 11,
    marginTop: 2,
  },
  videoContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoWrapper: {
    position: 'relative',
  },
  messageVideo: {
    width: '100%',
    height: 200, // Fixed height for videos
    borderRadius: 12,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  videoCaption: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },

});

export default ChatMessage;
