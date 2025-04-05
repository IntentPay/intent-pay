'use client'; // Required for Next.js

import { ReactNode, useEffect, createContext, useContext, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

// Extend Window interface to include MiniKit
declare global {
  interface Window {
    MiniKit?: {
      isInstalled: () => boolean;
      appId?: string;
      // Add other MiniKit methods that you need to access
    };
  }
}

// Create context to track World App environment status
interface MiniKitContextType {
  isWorldApp: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  forceDevelopmentMode: () => void;
}

const MiniKitContext = createContext<MiniKitContextType>({
  isWorldApp: false,
  isReady: false,
  isLoading: true,
  error: null,
  forceDevelopmentMode: () => {}
});

export const useMiniKit = () => useContext(MiniKitContext);

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MiniKitContextType>({
    isWorldApp: false,
    isReady: false,
    isLoading: true,
    error: null,
    forceDevelopmentMode: () => {}
  });

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
            forceDevelopmentMode 
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
            forceDevelopmentMode 
          }));
          return;
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
              forceDevelopmentMode 
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
              forceDevelopmentMode 
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
              forceDevelopmentMode 
            }));
          } else {
            // In production, we'll show an error
            setState(prev => ({ 
              ...prev,
              isWorldApp: false, 
              isReady: false, 
              isLoading: false, 
              error: 'This app must be run inside World App',
              forceDevelopmentMode 
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
            forceDevelopmentMode 
          }));
        } else {
          setState(prev => ({ 
            ...prev,
            isWorldApp: false, 
            isReady: false, 
            isLoading: false, 
            error: 'Initialization error: ' + (error instanceof Error ? error.message : String(error)),
            forceDevelopmentMode 
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
