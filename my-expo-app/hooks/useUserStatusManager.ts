import { useCallback, useEffect, useState } from 'react';
import { useUserStatus } from '../context/UserStatusContext';
import { useAuth } from '../context/AuthContext';
import { getUserStatus, getOnlineUsers } from '../utils/api';

type UserStatusData = {
  _id: string;
  name: string;
  email: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
};

export const useUserStatusManager = () => {
  const { user, isAuthenticated } = useAuth();
  const { userStatus, updateStatus } = useUserStatus();
  const [onlineUsers, setOnlineUsers] = useState<UserStatusData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get online users
  const fetchOnlineUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const response = await getOnlineUsers();
      if (response.status) {
        setOnlineUsers(response.users);
      }
    } catch (error) {
      console.error('Failed to fetch online users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Get specific user status
  const fetchUserStatus = useCallback(async (userId: string) => {
    try {
      const response = await getUserStatus(userId);
      return response.status ? response.userStatus : null;
    } catch (error) {
      console.error('Failed to fetch user status:', error);
      return null;
    }
  }, []);

  // Set status with custom message
  const setStatusWithMessage = useCallback(async (
    status: 'online' | 'away' | 'busy' | 'offline',
    message?: string
  ) => {
    try {
      await updateStatus(status);
      // You can add custom logic here for status messages
      if (message) {
        console.log(`Status updated to ${status}: ${message}`);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  }, [updateStatus]);

  // Auto-away after inactivity
  const enableAutoAway = useCallback(() => {
    // This is handled by the UserStatusContext
    // You can add additional logic here if needed
    console.log('Auto-away enabled');
  }, []);

  // Check if user is in a meeting (busy)
  const setMeetingStatus = useCallback(async (isInMeeting: boolean) => {
    try {
      if (isInMeeting) {
        await updateStatus('busy');
      } else {
        await updateStatus('online');
      }
    } catch (error) {
      console.error('Failed to set meeting status:', error);
    }
  }, [updateStatus]);

  // Refresh online users periodically
  useEffect(() => {
    if (isAuthenticated) {
      fetchOnlineUsers();
      
      const interval = setInterval(fetchOnlineUsers, 60000); // Every minute
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchOnlineUsers]);

  return {
    // Current user status
    userStatus,
    isOnline: userStatus === 'online',
    
    // Online users
    onlineUsers,
    isLoading,
    
    // Actions
    updateStatus,
    setStatusWithMessage,
    setMeetingStatus,
    enableAutoAway,
    fetchOnlineUsers,
    fetchUserStatus,
    
    // Computed values
    onlineCount: onlineUsers.filter(u => u.status === 'online').length,
    awayCount: onlineUsers.filter(u => u.status === 'away').length,
    busyCount: onlineUsers.filter(u => u.status === 'busy').length,
  };
};
