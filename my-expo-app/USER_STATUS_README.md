# User Status System Implementation

This document explains how to use the globally implemented user active status system in your Expo app.

## Overview

The user status system provides real-time tracking of user online/offline status with the following features:

- **Automatic Status Detection**: Monitors app state changes (active, background, inactive)
- **Manual Status Control**: Users can manually set their status
- **Real-time Updates**: Status changes are synced with the server
- **Status Indicators**: Visual indicators for different status types
- **Background Monitoring**: Continues to work when app is in background

## Status Types

- **Online** 🟢: User is actively using the app
- **Away** 🟡: User is inactive for 5+ minutes
- **Busy** 🔴: User has manually set status to busy
- **Offline** ⚫: User is offline or has manually set offline status

## Components

### 1. UserStatusProvider
The main context provider that manages user status globally.

```tsx
import { UserStatusProvider } from './context/UserStatusContext';

// Wrap your app with this provider
<UserStatusProvider>
  {/* Your app components */}
</UserStatusProvider>
```

### 2. UserStatusIndicator
A visual indicator showing current user status.

```tsx
import UserStatusIndicator from './components/UserStatusIndicator';

// Basic usage
<UserStatusIndicator />

// With text and last seen
<UserStatusIndicator showText showLastSeen size="large" />
```

### 3. UserStatusManager
A complete status management component with modal for status selection.

```tsx
import UserStatusManager from './components/UserStatusManager';

<UserStatusManager />
```

### 4. OnlineUsersList
Displays a list of all online users with their current status.

```tsx
import OnlineUsersList from './components/OnlineUsersList';

<OnlineUsersList />
```

## Hooks

### useUserStatus
Basic hook for accessing user status context.

```tsx
import { useUserStatus } from './context/UserStatusContext';

const { userStatus, isOnline, updateStatus } = useUserStatus();

// Update status
await updateStatus('busy');
```

### useUserStatusManager
Advanced hook with additional functionality.

```tsx
import { useUserStatusManager } from './hooks/useUserStatusManager';

const {
  userStatus,
  onlineUsers,
  updateStatus,
  setMeetingStatus,
  fetchOnlineUsers
} = useUserStatusManager();

// Set meeting status
await setMeetingStatus(true); // Sets status to 'busy'
await setMeetingStatus(false); // Sets status to 'online'
```

## API Endpoints

The system expects these backend endpoints:

### Update User Status
```
POST /api/user/status
{
  "status": "online" | "away" | "busy" | "offline",
  "lastSeen": "2024-01-01T00:00:00.000Z",
  "deviceId": "unique-device-id"
}
```

### Heartbeat
```
POST /api/user/heartbeat
{
  "deviceId": "unique-device-id"
}
```

### Get User Status
```
GET /api/user/{userId}/status
```

### Get Online Users
```
GET /api/users/online
```

## Integration Examples

### 1. Add Status to Profile Screen
```tsx
import UserStatusManager from '../components/UserStatusManager';

// In your profile component
<View className="mb-4 items-center">
  <UserStatusManager />
</View>
```

### 2. Show Status in Chat
```tsx
import UserStatusIndicator from '../components/UserStatusIndicator';

// In chat header
<View style={styles.chatHeader}>
  <Text>{chatUser.name}</Text>
  <UserStatusIndicator size="small" />
</View>
```

### 3. Display Online Users
```tsx
import OnlineUsersList from '../components/OnlineUsersList';

// In a screen or modal
<OnlineUsersList />
```

## Configuration

### Auto-Away Timer
The system automatically sets users to "away" after 5 minutes of inactivity. You can modify this in `UserStatusContext.tsx`:

```tsx
awayTimeout.current = setTimeout(() => {
  if (userStatus === 'online') {
    updateStatus('away');
  }
}, 5 * 60 * 1000); // 5 minutes - change this value
```

### Heartbeat Interval
Status updates are sent every 30 seconds when online. Modify in `UserStatusContext.tsx`:

```tsx
}, 30000); // 30 seconds - change this value
```

### Online Users Refresh
Online users list refreshes every minute. Modify in `useUserStatusManager.ts`:

```tsx
const interval = setInterval(fetchOnlineUsers, 60000); // 1 minute - change this value
```

## Device Identification

The system uses `expo-device` to generate unique device identifiers. This ensures that:

- Multiple devices for the same user are tracked separately
- Status changes from one device don't affect others
- Offline detection is accurate per device

## Background Behavior

- **iOS**: Status updates continue in background for limited time
- **Android**: Status updates continue in background
- **App State Changes**: Status automatically updates when app becomes active/inactive

## Error Handling

The system includes comprehensive error handling:

- Network failures are logged but don't crash the app
- Status updates are retried automatically
- Fallback statuses are used when server is unavailable

## Performance Considerations

- Status updates are batched to minimize API calls
- Heartbeat is only sent when user is online
- Online users list is cached and refreshed periodically
- App state listeners are properly cleaned up

## Troubleshooting

### Status Not Updating
1. Check if `UserStatusProvider` is wrapping your app
2. Verify backend endpoints are working
3. Check network connectivity
4. Review console logs for errors

### Multiple Status Updates
1. Ensure `UserStatusProvider` is only included once
2. Check for duplicate context providers
3. Verify app state listener setup

### Background Issues
1. Check platform-specific background behavior
2. Verify app permissions
3. Test on physical devices (simulators may behave differently)

## Future Enhancements

- **Custom Status Messages**: Allow users to set custom status text
- **Status History**: Track status changes over time
- **Push Notifications**: Notify when important users come online
- **Status Scheduling**: Set status to change at specific times
- **Team Status**: Show team/department status summaries
