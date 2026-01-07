import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User, AuthTokens } from "@/services/api/types";
import { authApi, authHelpers } from "@/services/api/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authHelpers.getStoredUser();
      const token = authHelpers.getToken();

      if (storedUser && token) {
        setUser(storedUser);
        // Optionally refresh user data from API
        try {
          const response = await authApi.getProfile();
          if (response.success && response.data) {
            setUser(response.data);
            localStorage.setItem("user", JSON.stringify(response.data));
          }
        } catch {
          // Token might be invalid, clear auth
          authHelpers.clearAuth();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    if (response.success && response.data) {
      const { user: userData, tokens } = response.data;
      authHelpers.setAuth(tokens, userData);
      setUser(userData);
    } else {
      throw new Error(response.message || "Login failed");
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const response = await authApi.register({
      name,
      email,
      password,
      password_confirmation: password,
    });
    if (response.success && response.data) {
      const { user: userData, tokens } = response.data;
      authHelpers.setAuth(tokens, userData);
      setUser(userData);
    } else {
      throw new Error(response.message || "Registration failed");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue with logout even if API call fails
    } finally {
      authHelpers.clearAuth();
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
      }
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
