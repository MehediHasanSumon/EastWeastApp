import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { getAccessToken, getRefreshToken, saveTokens, saveUser, clearAuth } from "../utils/authStorage";
import api from "../utils/api";

// Define a proper type for the context
type User = {
  _id: string;
  name: string;
  email: string;
  roles?: any[];
  permissions?: any[];
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
};

// Create the context with default value null
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define prop type
type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const refreshToken = await getRefreshToken();
      
      if (!refreshToken) {
        setUser(null);
        return false;
      }

      // Try to get current user info
      const response = await api.get('/api/me');
      
      if (response.data.status && response.data.user) {
        setUser(response.data.user);
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      await clearAuth();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/api/login', { email, password });
      
      if (response.data.status && response.data.user && response.data.token) {
        // Save tokens and user data
        await saveTokens({
          accessToken: response.data.token.accessToken,
          accessTokenExpiresIn: response.data.token.accessTokenExpiresIn,
          refreshToken: response.data.token.refreshToken,
          refreshTokenExpiresIn: response.data.token.refreshTokenExpiresIn,
        });
        await saveUser(response.data.user);
        
        setUser(response.data.user);
        return true;
      } else {
        console.error('Login failed:', response.data);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await clearAuth();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check authentication on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
