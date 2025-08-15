import React, { createContext, ReactNode, useContext, useState } from "react";

// Define a proper type for the context
type AuthContextType = {
  user: { email: string } | null;
  login: (email: string) => void;
  logout: () => void;
};

// Create the context with default value null
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define prop type
type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<{ email: string } | null>(null);

  const login = (_email: string) => {};
  const logout = () => {};

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
