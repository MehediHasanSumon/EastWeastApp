# Chat Components

This directory contains the separated components for the chat functionality, making the code more modular and maintainable.

## Component Structure

### 1. ChatHeader (`ChatHeader.tsx`)
- **Purpose**: Displays the chat header with user info, back button, and action buttons
- **Features**:
  - Back navigation button
  - User/group avatar and name
  - Call, video, and info action buttons
  - Gradient background with theme support
- **Props**:
  - `conversation`: Current conversation object
  - `currentUser`: Current authenticated user
  - `onShowUserInfo`: Callback to show user info modal

### 2. ChatMessage (`ChatMessage.tsx`)
- **Purpose**: Renders individual chat messages with proper styling and interactions
- **Features**:
  - Message bubble styling (own vs. other messages)
  - Avatar display for group chats
  - Message content, attachments, and reactions
  - Message status indicators (sent, delivered, read)
  - Long press for message actions
- **Props**:
  - `message`: Message object to display
  - `index`: Message index in the list
  - `messages`: Array of all messages for grouping logic
  - `currentUser`: Current authenticated user
  - `onLongPress`: Callback for message long press
  - `onReactionPress`: Callback for reaction press
  - `onReactionLongPress`: Callback for reaction long press

### 3. ChatInput (`ChatInput.tsx`)
- **Purpose**: Handles message input with text input and action buttons
- **Features**:
  - Multi-line text input with auto-height
  - Document and image picker buttons
  - Send button with loading state
  - Animated input height and send button
- **Props**:
  - `messageText`: Current message text
  - `onMessageChange`: Callback for text changes
  - `onSendMessage`: Callback for sending message
  - `onImagePicker`: Callback for image picker
  - `onDocumentPicker`: Callback for document picker
  - `isSending`: Loading state for send button
  - `inputHeightAnim`: Animated value for input height
  - `sendButtonScaleAnim`: Animated value for send button scale

### 4. TypingIndicator (`TypingIndicator.tsx`)
- **Purpose**: Shows when other users are typing
- **Features**:
  - Animated typing dots
  - User names display
  - Theme-aware styling
- **Props**:
  - `typingUsers`: Array of users currently typing
  - `currentUserId`: Current user ID to filter out

### 5. DateSeparator (`DateSeparator.tsx`)
- **Purpose**: Displays date separators between messages
- **Features**:
  - Automatic date detection
  - Formatted date display
  - Theme-aware styling
- **Props**:
  - `message`: Current message
  - `index`: Message index
  - `messages`: Array of all messages

## Usage

### Importing Components
```tsx
import {
  ChatHeader,
  ChatMessage,
  ChatInput,
  TypingIndicator,
  DateSeparator,
} from '../components/Chat';
```

### Basic Implementation
```tsx
// In your chat screen
<ChatHeader
  conversation={currentConversation}
  currentUser={user}
  onShowUserInfo={() => setShowUserInfo(true)}
/>

<FlatList
  data={messages}
  renderItem={({ item, index }) => (
    <>
      <DateSeparator
        message={item}
        index={index}
        messages={messages}
      />
      <ChatMessage
        message={item}
        index={index}
        messages={messages}
        currentUser={user}
        onLongPress={handleMessageLongPress}
        onReactionPress={handleReactionPress}
        onReactionLongPress={handleReactionLongPress}
      />
    </>
  )}
  ListFooterComponent={() => (
    <TypingIndicator
      typingUsers={typingUsers}
      currentUserId={user?._id || null}
    />
  )}
/>

<ChatInput
  messageText={messageText}
  onMessageChange={handleTyping}
  onSendMessage={handleSendMessage}
  onImagePicker={handleImagePicker}
  onDocumentPicker={handleDocumentPicker}
  isSending={isSending}
  inputHeightAnim={inputHeightAnim}
  sendButtonScaleAnim={sendButtonScaleAnim}
/>
```

## Benefits of Separation

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be used in other parts of the app
3. **Testing**: Easier to write unit tests for individual components
4. **Performance**: Better optimization and memoization opportunities
5. **Code Organization**: Clearer structure and easier navigation
6. **Team Collaboration**: Multiple developers can work on different components

## File Sizes

- **Original ChatScreen**: ~36KB, 1169 lines
- **New ChatScreen**: ~15KB, ~400 lines
- **Total Components**: ~25KB, ~600 lines (distributed across 5 files)

## Theme Support

All components support both light and dark themes through the `useTheme` hook and automatically adapt their styling accordingly.

## Dependencies

- `react-native`: Core React Native components
- `@expo/vector-icons`: Ionicons for various UI elements
- `expo-linear-gradient`: For gradient backgrounds
- `@react-navigation/native`: For navigation functionality
