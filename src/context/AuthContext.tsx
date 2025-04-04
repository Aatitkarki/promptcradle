console.log('AuthContext: useAuth start');

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { toast } from "sonner";
import { } from "@/services/supabase";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for authenticated user on component mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = null;
        setUser(user);
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement custom sign-in logic
      const user = { id: 'temp', username: email.split('@')[0], email };
      setUser(user);
      toast.success("Signed in successfully!");
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error(error instanceof Error ? error.message : "Error signing in");
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement custom sign-up logic
      const user = { id: 'temp', username, email };
      setUser(user);
      toast.success("Account created successfully!");
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error(error instanceof Error ? error.message : "Error creating account");
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // TODO: Implement custom sign-out logic
      setUser(null);
      toast.info("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Error signing out");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

console.log('AuthContext: useAuth end');
