import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { authApi } from "../services/api";
import type { User, LoginResponse } from "../types";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => void;
  loginWithFacebook: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (error) {
        // No valid session
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleGoogleSuccess = useCallback(async (tokenResponse: any) => {
    try {
      setIsLoading(true);

      // Get user info from Google
      const googleUserResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        }
      );

      const googleUser = await googleUserResponse.json();

      // Send to our backend
      const response: LoginResponse = await authApi.googleLogin({
        email: googleUser.email,
        name: googleUser.name,
        provider_id: googleUser.sub,
      });

      setUser(response.user);

      if (response.is_new_user) {
        toast.success(
          `Welcome, ${response.user.name}! You have ${response.user.demo_minutes_remaining} free minutes to try.`
        );
      } else {
        toast.success(`Welcome back, ${response.user.name}!`);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(
        error.response?.data?.error || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFacebookSuccess = useCallback(async (facebookResponse: any) => {
    try {
      setIsLoading(true);

      // Send to our backend
      const response: LoginResponse = await authApi.facebookLogin({
        email: facebookResponse.email,
        name: facebookResponse.name,
        provider_id: facebookResponse.userID || facebookResponse.id,
      });

      setUser(response.user);

      if (response.is_new_user) {
        toast.success(
          `Welcome, ${response.user.name}! You have ${response.user.demo_minutes_remaining} free minutes to try.`
        );
      } else {
        toast.success(`Welcome back, ${response.user.name}!`);
      }
    } catch (error: any) {
      console.error("Facebook login error:", error);
      toast.error(
        error.response?.data?.error ||
          "Facebook login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (error) => {
      console.error("Google login error:", error);
      toast.error("Google login failed. Please try again.");
    },
  });

  const loginWithFacebook = useCallback(() => {
    // This will be called from the Facebook button component
    return handleFacebookSuccess;
  }, [handleFacebookSuccess]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear user state even if API call fails
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    loginWithGoogle: () => loginWithGoogle(),
    loginWithFacebook,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
