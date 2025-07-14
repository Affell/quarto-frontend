import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "../types/api";
import backendAPI from "../services/backendAPI";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au démarrage
    if (backendAPI.isAuthenticated()) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await backendAPI.login({ email, password });
      setUser(response.user);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signup = async (
    email: string,
    username: string,
    password: string
  ): Promise<void> => {
    try {
      await backendAPI.signup({ email, username, password });
      // Après l'inscription, connecter automatiquement l'utilisateur
      await login(email, password);
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await backendAPI.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      backendAPI.clearToken();
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const userData = await backendAPI.getMe();
      setUser(userData);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // Si l'obtention des données utilisateur échoue, déconnecter
      backendAPI.clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
