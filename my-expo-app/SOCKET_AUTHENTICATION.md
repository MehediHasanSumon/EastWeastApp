# Socket Authentication Implementation

## Overview

This document explains how socket authentication is implemented in the Android app to match the web application's authentication pattern.

## Authentication Flow

### 1. Token Storage
- **Refresh Token**: Stored in AsyncStorage as `auth_refresh_token`
- **Access Token**: Stored in AsyncStorage as `auth_access_token`
- **User Data**: Stored in AsyncStorage as `auth_user`

### 2. Socket Connection Process

#### Initial Connection
1. **Wait for Auth Hydration**: Socket connection waits for `isAuthenticated`, `hydrated`, and `user` to be true
2. **Get Refresh Token**: Uses `getSocketAuthToken()` to retrieve the refresh token
3. **Connect Socket**: Sends refresh token via `auth: { token: refreshToken }` in socket connection
4. **Fallback**: If no refresh token, attempts to refresh session using `refreshSession()`

#### Reconnection Logic
1. **Automatic Reconnection**: Socket.IO handles reconnection attempts
2. **Auth Verification**: On reconnection, verifies authentication is still valid
3. **Token Refresh**: If auth is lost, attempts to refresh session

### 3. Server-Side Authentication

The server accepts authentication in multiple formats (matching web app pattern):

```typescript
// Primary method (used by Android app)
socket.handshake.auth.token = refreshToken

// Fallback methods (for compatibility)
socket.handshake.headers["x-refresh-token"] = refreshToken
socket.handshake.headers.authorization = "Bearer " + refreshToken
```

### 4. Error Handling

#### Authentication Errors
- **Invalid Token**: Triggers session refresh attempt
- **User Not Found**: Logs error and disconnects socket
- **Token Expired**: Automatically attempts to refresh session

#### Connection Errors
- **XHR Poll Error**: Usually indicates server connectivity issues
- **Network Issues**: Handled by Socket.IO reconnection logic
- **CORS Issues**: Logged with detailed debugging information

## Key Differences from Web App

### Web App Pattern
```typescript
// Web app gets token from cookie
const token = getCookie("rt");
const authToken = hexToString(token);
this.socket = io("http://localhost:8000", {
  auth: { token: authToken }
});
```

### Android App Pattern
```typescript
// Android app gets token from AsyncStorage
const token = await getSocketAuthToken(); // Returns refresh token
this.socket = io(socketUrl, {
  auth: { token: token }
});
```

## Implementation Files

### 1. `utils/authStorage.ts`
- `getSocketAuthToken()`: Returns refresh token for socket authentication
- `getRefreshToken()`: Returns refresh token for API calls
- `getAccessToken()`: Returns access token for API calls

### 2. `utils/chatSocket.ts`
- `ChatSocketService.connect()`: Handles socket connection with refresh token
- Error handling for authentication failures
- Detailed logging for debugging

### 3. `context/ChatContext.tsx`
- Waits for proper authentication state before connecting
- Handles token refresh on authentication failures
- Manages socket reconnection with auth verification

### 4. `store/authSlice.ts`
- `refreshSession()`: Refreshes authentication tokens
- `hydrateAuth()`: Loads persisted authentication state
- Manages authentication state lifecycle

## Security Considerations

### 1. Token Storage
- Tokens stored in AsyncStorage (encrypted in production)
- No hardcoded tokens in code
- Automatic token refresh on expiration

### 2. Socket Security
- Refresh token used for socket authentication
- Server validates tokens using JWT verification
- Automatic disconnection on authentication failure

### 3. Error Handling
- No sensitive information logged
- Graceful fallback on authentication failures
- Automatic cleanup on logout

## Testing

### 1. Development
- Use Expo development build
- Check console logs for authentication flow
- Verify token refresh on expiration

### 2. Production
- Ensure proper token encryption
- Test authentication failure scenarios
- Verify automatic reconnection behavior

## Troubleshooting

### Common Issues

#### 1. "No refresh token available"
- Check if user is properly logged in
- Verify AsyncStorage has valid tokens
- Check authentication state hydration

#### 2. "Authentication error" from server
- Verify refresh token is valid
- Check server authentication middleware
- Ensure token format matches server expectations

#### 3. "XHR poll error"
- Check server is running
- Verify socket URL configuration
- Check network connectivity

### Debug Steps

1. **Check Authentication State**
   ```typescript
   console.log('Auth state:', { user, isAuthenticated, hydrated });
   ```

2. **Verify Token Storage**
   ```typescript
   const token = await getSocketAuthToken();
   console.log('Socket auth token:', token ? 'Present' : 'Missing');
   ```

3. **Check Socket Connection**
   ```typescript
   console.log('Socket connected:', chatSocketService.getConnectionStatus());
   ```

4. **Server Logs**
   - Check server console for authentication attempts
   - Verify token validation in server middleware
   - Check for CORS or network issues

## Future Improvements

### 1. Token Refresh
- Implement automatic token refresh before expiration
- Add retry mechanism for failed refresh attempts
- Handle concurrent refresh requests

### 2. Offline Support
- Queue messages when offline
- Sync when connection restored
- Handle partial message delivery

### 3. Enhanced Security
- Implement token rotation
- Add device fingerprinting
- Implement rate limiting for auth attempts
