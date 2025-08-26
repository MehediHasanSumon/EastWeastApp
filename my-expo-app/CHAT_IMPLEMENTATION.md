# Chat Implementation Documentation

## Overview
This document describes the new messaging implementation for the Android app, which has been re-architected to match the web app's structure and components.

## Architecture

### Components Structure
```
components/Chat/
├── MessageBubble.tsx      # Individual message display with actions
├── MessageInput.tsx       # Message input with attachments and emojis
├── ConversationList.tsx   # List of conversations
└── ChatInterface.tsx      # Main chat interface
```

### State Management
- **Redux Store**: Uses `@reduxjs/toolkit` for state management
- **Chat Slice**: Manages conversations, messages, typing states, and UI state
- **Async Thunks**: Handle API calls for conversations and messages

### Socket Communication
- **ChatSocketService**: Manages WebSocket connections and real-time communication
- **Event Handling**: Supports message delivery, typing indicators, and presence updates
- **Reconnection**: Automatic reconnection with exponential backoff

### API Layer
- **ChatApiService**: RESTful API calls for chat operations
- **File Uploads**: Support for images, documents, and voice messages
- **Authentication**: Bearer token-based authentication

## Key Features

### Message Types
- **Text Messages**: Standard text with markdown support
- **Image Messages**: Photo sharing with previews
- **File Messages**: Document sharing with metadata
- **Voice Messages**: Audio recording and playback

### Message Actions
- **Reactions**: Emoji reactions (👍, ❤️, 😂)
- **Reply**: Reply to specific messages
- **Forward**: Forward messages to other conversations
- **Edit**: Edit own messages
- **Delete**: Delete own messages

### Conversation Management
- **Direct Messages**: One-on-one conversations
- **Group Chats**: Multi-participant conversations
- **Search**: Find conversations and users
- **Mute/Unmute**: Control notification preferences
- **Pin/Unpin**: Pin important conversations

### Real-time Features
- **Typing Indicators**: Show when users are typing
- **Online Status**: Real-time presence updates
- **Message Delivery**: Delivery and read receipts
- **Push Notifications**: Background message notifications

## Implementation Details

### Message Flow
1. User types message in `MessageInput`
2. Message sent via WebSocket to server
3. Optimistic update in Redux store
4. Server broadcasts to other participants
5. Message received via WebSocket and added to store
6. UI updates to show new message

### Typing Indicators
1. User starts typing in `MessageInput`
2. `startTyping` event sent via WebSocket
3. Other users receive `typing_start` event
4. Typing indicator displayed in `ChatInterface`
5. User stops typing, `stopTyping` event sent
6. Typing indicator removed

### File Uploads
1. User selects file in `MessageInput`
2. File uploaded to server via `ChatApiService`
3. Upload progress tracked and displayed
4. File message created with metadata
5. Message sent via normal message flow

## Configuration

### Server URLs
- **WebSocket**: `http://localhost:8000` (configurable in `chatSocket.ts`)
- **API**: `http://localhost:8000/api` (configurable in `chatApi.ts`)

### Authentication
- **Token Storage**: Configure in `chatApi.ts` and `chatSocket.ts`
- **Token Format**: Bearer token in Authorization header

### Dependencies
- `socket.io-client`: WebSocket communication
- `@reduxjs/toolkit`: State management
- `react-redux`: Redux bindings
- `@expo/vector-icons`: UI icons

## Usage Examples

### Basic Message Sending
```typescript
const handleSendMessage = async (content: string) => {
  await onSendMessage(content, 'text');
};
```

### File Upload
```typescript
const handleFileUpload = async (file: File) => {
  const result = await chatApiService.uploadFile(file, conversationId);
  await onSendMessage('', 'file', result.fileUrl, undefined, undefined, result.fileName, result.fileSize);
};
```

### Socket Connection
```typescript
const { connectSocket } = useChat();
useEffect(() => {
  connectSocket(authToken);
}, [authToken]);
```

## Migration Notes

### Removed Components
- `ChatScreen.tsx` - Replaced with `MessengerScreen.tsx`
- `EnhancedChatScreen.tsx` - Functionality merged into `ChatInterface.tsx`
- `ConversationListScreen.tsx` - Replaced with `ConversationList.tsx`
- `EnhancedMessageBubble.tsx` - Replaced with `MessageBubble.tsx`
- `EnhancedMessageInput.tsx` - Replaced with `MessageInput.tsx`

### New Structure
- **Screens**: `MessengerScreen.tsx` handles the main messaging flow
- **Components**: Modular chat components in `components/Chat/`
- **State**: Centralized Redux store with chat slice
- **API**: RESTful API service with WebSocket support

### Breaking Changes
- Chat context API has changed
- Message structure updated to match web app
- Socket event handling restructured
- State management moved to Redux

## Future Enhancements

### Planned Features
- **End-to-End Encryption**: Message encryption for privacy
- **Message Threading**: Organized conversation threads
- **Advanced Search**: Full-text message search
- **Message Scheduling**: Send messages at specific times
- **Translation**: Automatic message translation

### Performance Optimizations
- **Message Pagination**: Load messages in chunks
- **Image Optimization**: Compress and resize images
- **Offline Support**: Queue messages when offline
- **Background Sync**: Sync messages in background

## Troubleshooting

### Common Issues
1. **Socket Connection Failed**: Check server URL and authentication
2. **Messages Not Loading**: Verify API endpoints and authentication
3. **Typing Indicators Not Working**: Check WebSocket connection status
4. **File Uploads Failing**: Verify file size limits and server configuration

### Debug Mode
Enable debug logging in `chatSocket.ts` and `chatApi.ts` for troubleshooting.

## Support
For issues or questions about the chat implementation, refer to:
- Web app implementation for reference
- Redux DevTools for state debugging
- WebSocket inspector for connection issues
- API documentation for endpoint details
