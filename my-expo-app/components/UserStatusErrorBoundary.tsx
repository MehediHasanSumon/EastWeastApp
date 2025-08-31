import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { shouldLog } from '../config/userStatusConfig';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class UserStatusErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error in development, ignore in production
    shouldLog(`UserStatus Error: ${error.message}`, 'error');
    
    if (__DEV__) {
      console.error('UserStatus Error Boundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // In production, render fallback or null to prevent app crashes
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback - minimal UI that won't break the app
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Status unavailable</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default UserStatusErrorBoundary;
