import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthService } from '../services/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safely initialize authentication with error handling
    const initializeAuth = async () => {
      try {
        // Get initial user
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);

        // Listen for auth changes
        const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
          setUser(user);
          setLoading(false);
        });

        // Store subscription for cleanup
        return subscription;
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
        // Don't crash the app - just set loading to false
        setUser(null);
        return null;
      } finally {
        setLoading(false);
      }
    };

    let subscription: any = null;

    initializeAuth().then((sub) => {
      subscription = sub;
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await AuthService.signIn(email, password);
      toast.success('Welcome back!');
    } catch (error) {
      console.error('Sign in error:', error);
      const message = error instanceof Error ? error.message : 'Failed to sign in. Please check your connection and try again.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true);
      await AuthService.signUp(email, password, name);
      toast.success('Account created successfully!');
    } catch (error) {
      console.error('Sign up error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create account. Please check your connection and try again.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
      // Don't throw error for sign out - just log it
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
