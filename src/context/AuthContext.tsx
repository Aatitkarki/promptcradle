
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to generate random IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved user data on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Simulate API call
      setIsLoading(true);
      
      // Retrieve users from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const foundUser = users.find((u: any) => 
        u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (!foundUser) {
        throw new Error("User not found. Please check your email or sign up.");
      }
      
      // In a real app, you would use proper password hashing and validation
      if (foundUser.password !== password) {
        throw new Error("Invalid password. Please try again.");
      }
      
      // Create the user object (excluding the password)
      const userObj: User = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email
      };
      
      // Save user to state and localStorage
      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      
      toast.success("Signed in successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error signing in");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Retrieve existing users or initialize empty array
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check if user with email already exists
      if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("A user with this email already exists");
      }
      
      // Create new user
      const newUser = {
        id: `user-${generateId()}`,
        username,
        email,
        password // In a real app, this would be hashed
      };
      
      // Add new user to the users array
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Create the user object for the context (excluding the password)
      const userObj: User = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      };
      
      // Save user to state and localStorage
      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      
      toast.success("Account created successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error creating account");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('user');
    setUser(null);
    toast.info("Signed out successfully");
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
