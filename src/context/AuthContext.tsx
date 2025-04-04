console.log('AuthContext: useAuth start');

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { toast } from "sonner";
import * as ApiService from "@/services/api"; // Import the new API service

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
      setIsLoading(true); // Start loading
      try {
        // Attempt to get user info based on stored token
        const currentUser = await ApiService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking authentication:", error);
        // Don't show toast on initial load error, just log it
        setUser(null); // Ensure user is null if check fails
        localStorage.removeItem("authToken"); // Clean up potentially invalid token
      } finally {
        setIsLoading(false); // Stop loading regardless of outcome
      }
    };

    checkUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser } = await ApiService.signIn({ email, password }); // Token is stored within signIn
      setUser(loggedInUser);
      toast.success("Signed in successfully!");
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error(error instanceof Error ? error.message : "Error signing in");
      setUser(null); // Ensure user is null on failed sign-in
      localStorage.removeItem("authToken"); // Clean up token on error
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Assuming signup API returns the new user and potentially logs them in (returns token)
      // Adjust based on actual API behavior
      const newUser = await ApiService.signUp({ username, email, password });
      // If signup also logs the user in and returns a token, handle it here or in ApiService.signUp
      // For now, assume it just creates the user, and they need to log in separately.
      // setUser(newUser); // Optionally set user state if signup logs them in
      toast.success("Account created successfully! Please sign in.");
      // Redirect to login or show login form?
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error(error instanceof Error ? error.message : "Error creating account");
      setUser(null); // Ensure user is null on failed sign-up
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await ApiService.signOut(); // Clears token from localStorage
      setUser(null);
      toast.info("Signed out successfully");
      // Optionally redirect to home or login page
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
