'use client'; // Required for Next.js

import { ReactNode, useEffect, createContext, useContext, useState } from 'react';
import { MiniKit, AsyncHandlerReturn, verifySiweMessage } from '@worldcoin/minikit-js';

// Define interfaces for Wallet Auth
interface WalletAuthInput {
  nonce: string;
  expirationTime?: Date;
  statement?: string;
  requestId?: string;
  notBefore?: Date;
}

interface MiniAppWalletAuthSuccessPayload {
  status: 'success';
  message: string;
  signature: string;
  address: string;
  version: number;
}

interface MiniAppWalletAuthErrorPayload {
  status: 'error';
  error: string;
}

type WalletAuthPayload = MiniAppWalletAuthSuccessPayload | MiniAppWalletAuthErrorPayload;

// Extend Window interface to include MiniKit
declare global {
  interface Window {
    MiniKit?: {
      isInstalled: () => boolean;
      appId?: string;
      walletAddress?: string;
      user?: {
        username?: string;
        profilePictureUrl?: string;
      };
      getUserByAddress?: (address: string) => Promise<any>;
      commandsAsync?: {
        verify: any;
        walletAuth: (input: WalletAuthInput) => Promise<{
          commandPayload: any;
          finalPayload: WalletAuthPayload;
        }>;
      };
      // Add other MiniKit methods that you need to access
    };
  }
}

// Extend MiniKit to include Wallet Auth methods
declare module '@worldcoin/minikit-js' {
  interface MiniKitCommands {
    walletAuth: (input: WalletAuthInput) => Promise<{
      commandPayload: any;
      finalPayload: WalletAuthPayload;
    }>;
  }
}

// Create context to track World App environment status
interface MiniKitContextType {
  isWorldApp: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  forceDevelopmentMode: () => void;
  walletAddress: string | null;
  walletAuthData: any | null;
  signInWithWallet: () => Promise<boolean>;
  isSignedIn: boolean;
  username: string | null;
  profilePictureUrl: string | null;
  worldId: string | null;
}

const MiniKitContext = createContext<MiniKitContextType>({
  isWorldApp: false,
  isReady: false,
  isLoading: true,
  error: null,
  forceDevelopmentMode: () => {},
  walletAddress: null,
  walletAuthData: null,
  signInWithWallet: async () => false,
  isSignedIn: false,
  username: null,
  profilePictureUrl: null,
  worldId: null,
});

export const useMiniKit = () => useContext(MiniKitContext);

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MiniKitContextType>({
    isWorldApp: false,
    isReady: false,
    isLoading: true,
    error: null,
    forceDevelopmentMode: () => {},
    walletAddress: null,
    walletAuthData: null,
    signInWithWallet: async () => false,
    isSignedIn: false,
    username: null,
    profilePictureUrl: null,
    worldId: null,
  });

  // Sign in with wallet implementation
  const signInWithWallet = async (): Promise<boolean> => {
    if (!MiniKit.isInstalled()) {
      console.error('Cannot sign in - MiniKit is not installed');
      return false;
    }

    try {
      console.log('🔐 Attempting to sign in with wallet');
      
      // Get a nonce from our backend to use in SIWE flow
      const res = await fetch(`/api/nonce`);
      const { nonce } = await res.json();
      
      // Call MiniKit walletAuth command
      // @ts-ignore - We're handling the MiniKit.commandsAsync.walletAuth TypeScript issue with this ignore
      const { commandPayload, finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: nonce,
        requestId: '0', // Optional
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: 'Sign in to IntentPay',
      });
      
      if (finalPayload.status === 'error') {
        console.error('❌ Sign in failed:', finalPayload);
        return false;
      }
      
      // Verify the signature on the backend
      const verificationResponse = await fetch('/api/complete-siwe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: finalPayload,
          nonce,
        }),
      });
      
      const verificationResult = await verificationResponse.json();
      
      if (verificationResult.status !== 'success' || !verificationResult.isValid) {
        console.error('❌ Signature verification failed:', verificationResult);
        return false;
      }
      
      // Successfully signed in
      console.log('✅ Sign in successful:', finalPayload);
      
      // Try to get user details if available
      let username = null;
      let profilePictureUrl = null;
      
      try {
        // Get user details from MiniKit if available
        if (MiniKit.user) {
          console.log('User info from MiniKit:', MiniKit.user);
          username = MiniKit.user.username || null;
          profilePictureUrl = MiniKit.user.profilePictureUrl || null;
        }
        
        // If MiniKit.user is not available, try to get user info by address
        if (!username && MiniKit.getUserByAddress && finalPayload.status === 'success') {
          const userDetails = await MiniKit.getUserByAddress((finalPayload as MiniAppWalletAuthSuccessPayload).address);
          console.log('User details from getUserByAddress:', userDetails);
          
          if (userDetails) {
            username = userDetails.username || null;
            profilePictureUrl = userDetails.profilePictureUrl || null;
          }
        }
      } catch (error) {
        console.warn('Failed to get user details:', error);
      }
      
      // Update state with wallet info
      setState(prev => ({
        ...prev,
        walletAddress: MiniKit.walletAddress || (finalPayload as MiniAppWalletAuthSuccessPayload).address || null,
        walletAuthData: finalPayload,
        isSignedIn: true,
        username: username,
        profilePictureUrl: profilePictureUrl
      }));
      
      // Save auth data to localStorage for persistence
      localStorage.setItem('wallet_auth_data', JSON.stringify(finalPayload || {}));
      localStorage.setItem('wallet_address', MiniKit.walletAddress || (finalPayload as MiniAppWalletAuthSuccessPayload).address || '');
      localStorage.setItem('wallet_auth_signed_in', 'true');
      if (username) {
        localStorage.setItem('wallet_auth_username', username);
      }
      if (profilePictureUrl) {
        localStorage.setItem('wallet_auth_profile_picture', profilePictureUrl);
      }
      
      // Store World ID if available from localStorage
      const worldId = localStorage.getItem('worldid_user') ? 
        JSON.parse(localStorage.getItem('worldid_user') || '{}').worldId : null;
      
      if (worldId) {
        setState(prev => ({
          ...prev,
          worldId
        }));
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error during wallet sign in:', error);
      return false;
    }
  };

  useEffect(() => {
    // Create the forceDevelopmentMode function that will be exposed through the context
    const forceDevelopmentMode = () => {
      console.log('🧪 Development mode forced by user');
      setState(prev => ({ 
        ...prev, 
        isWorldApp: false, 
        isReady: true,
        isLoading: false,
        error: null 
      }));
      
      // Set a flag in localStorage to remember this choice
      if (typeof window !== 'undefined') {
        localStorage.setItem('dev_mode_forced', 'true');
      }
    };
    
    const initializeMiniKit = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          setState(prev => ({ 
            ...prev, 
            isWorldApp: false, 
            isReady: false, 
            isLoading: false, 
            error: 'Server-side rendering',
            forceDevelopmentMode,
            signInWithWallet
          }));
          return;
        }
        
        // Check if development mode was previously forced
        const devModeForced = localStorage.getItem('dev_mode_forced') === 'true';
        if (devModeForced) {
          console.log('🧪 Development mode previously forced by user');
          setState(prev => ({ 
            ...prev, 
            isWorldApp: false, 
            isReady: true, 
            isLoading: false, 
            error: null,
            forceDevelopmentMode,
            signInWithWallet 
          }));
          return;
        }
        
        // Get cookies from the cookie store
        const savedWalletAddress = localStorage.getItem('wallet_address');
        const savedWalletAuthData = localStorage.getItem('wallet_auth_data');
        const savedIsSignedIn = localStorage.getItem('wallet_auth_signed_in') === 'true';
        const savedUsername = localStorage.getItem('wallet_auth_username');
        const savedProfilePicture = localStorage.getItem('wallet_auth_profile_picture');
        
        // Get World ID from localStorage if available
        let savedWorldId = null;
        try {
          const worldIdUserData = localStorage.getItem('worldid_user');
          if (worldIdUserData) {
            const parsedWorldIdUser = JSON.parse(worldIdUserData);
            savedWorldId = parsedWorldIdUser.worldId || null;
          }
        } catch (error) {
          console.warn('Failed to parse World ID user data', error);
        }
        
        let parsedWalletAuthData = null;
        try {
          if (savedWalletAuthData) {
            parsedWalletAuthData = JSON.parse(savedWalletAuthData);
          }
        } catch (e) {
          console.warn('❌ Failed to parse saved wallet auth data');
        }
        
        // Development mode detection
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        try {
          // Try to install MiniKit - this will fail if not in World App
          await MiniKit.install();
          
          // Check if MiniKit is actually available
          if (window.MiniKit && window.MiniKit.isInstalled()) {
            console.log('🌍 Running inside World App - MiniKit initialized successfully');
            setState(prev => ({ 
              ...prev, 
              isWorldApp: true, 
              isReady: true, 
              isLoading: false, 
              error: null,
              forceDevelopmentMode,
              signInWithWallet,
              // Restore auth state if available
              walletAddress: MiniKit.walletAddress || savedWalletAddress || null,
              walletAuthData: parsedWalletAuthData,
              isSignedIn: savedIsSignedIn,
              username: MiniKit.user?.username || savedUsername || null,
              profilePictureUrl: MiniKit.user?.profilePictureUrl || savedProfilePicture || null,
              worldId: savedWorldId
            }));
          } else if (isDevelopment) {
            // In development mode, proceed without MiniKit
            console.log('🧪 Development mode - proceeding without World App');
            setState(prev => ({ 
              ...prev, 
              isWorldApp: false, 
              isReady: true, 
              isLoading: false, 
              error: null,
              forceDevelopmentMode,
              signInWithWallet,
              // In dev mode, we might still restore saved auth data
              walletAddress: savedWalletAddress || null,
              walletAuthData: parsedWalletAuthData,
              isSignedIn: savedIsSignedIn,
              username: savedUsername || null,
              profilePictureUrl: savedProfilePicture || null,
              worldId: savedWorldId
            }));
          } else {
            throw new Error('MiniKit installation failed');
          }
        } catch (error) {
          // Handle MiniKit installation error
          console.error('MiniKit initialization error:', error);
          
          if (isDevelopment) {
            // In development, we'll let the app continue without MiniKit
            console.log('🧪 Development mode - proceeding without World App');
            setState(prev => ({ 
              ...prev, 
              isWorldApp: false, 
              isReady: true, 
              isLoading: false, 
              error: null,
              forceDevelopmentMode,
              signInWithWallet,
              // In dev mode, we might still restore saved auth data
              walletAddress: savedWalletAddress || null,
              walletAuthData: parsedWalletAuthData,
              isSignedIn: savedIsSignedIn,
              username: savedUsername || null,
              profilePictureUrl: savedProfilePicture || null,
              worldId: savedWorldId
            }));
          } else {
            // In production, we'll show an error
            setState(prev => ({ 
              ...prev,
              isWorldApp: false, 
              isReady: false, 
              isLoading: false, 
              error: 'This app must be run inside World App',
              forceDevelopmentMode,
              signInWithWallet
            }));
          }
        }
      } catch (error) {
        console.error('Outer MiniKit initialization error:', error);
        
        // Fallback to development mode if something else fails
        if (process.env.NODE_ENV === 'development') {
          console.log('🧪 Fallback to development mode due to initialization error');
          setState(prev => ({ 
            ...prev, 
            isWorldApp: false, 
            isReady: true, 
            isLoading: false, 
            error: null,
            forceDevelopmentMode,
            signInWithWallet
          }));
        } else {
          setState(prev => ({ 
            ...prev,
            isWorldApp: false, 
            isReady: false, 
            isLoading: false, 
            error: 'Initialization error: ' + (error instanceof Error ? error.message : String(error)),
            forceDevelopmentMode,
            signInWithWallet
          }));
        }
      }
    };

    initializeMiniKit();
    
    // Cleanup when component unmounts
    return () => {
      // Any cleanup needed for MiniKit
    };
  }, []);

  return (
    <MiniKitContext.Provider value={state}>
      {children}
    </MiniKitContext.Provider>
  );
}
