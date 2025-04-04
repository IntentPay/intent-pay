'use client';

import { useState, useCallback, useEffect } from 'react';
import { MiniKit, VerifyCommandInput, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js';

// Default action ID for IntentPay
const DEFAULT_ACTION = 'wallet-verification';

interface ErrorPayload {
  status: 'error';
  message?: string;
}

export interface WorldIDVerificationResult {
  isVerified: boolean;
  isVerifying: boolean;
  error: string | null;
  verifyUser: (signal?: string) => Promise<boolean>;
  isWorldApp: boolean;
}

export function useWorldID(
  action = DEFAULT_ACTION,
  defaultSignal?: string
): WorldIDVerificationResult {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isWorldApp, setIsWorldApp] = useState<boolean>(false);

  // Check if we're in a World App environment and load verification status
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // Check if MiniKit is available in the window object
        const isMiniKitAvailable = typeof window !== 'undefined' && 
          'MiniKit' in window && 
          typeof (window as any).MiniKit.isInstalled === 'function';
        
        // Only call isInstalled if MiniKit is actually available
        const isInstalled = isMiniKitAvailable ? MiniKit.isInstalled() : false;
        console.log('🔍 World App detection - MiniKit available:', isMiniKitAvailable, 'isInstalled:', isInstalled);
        setIsWorldApp(isInstalled);
        
        // Attempt to load verification status from local storage
        const storedStatus = localStorage.getItem('worldid_verified');
        if (storedStatus === 'true') {
          console.log('🔍 Loaded verification status from localStorage: verified');
          setIsVerified(true);
        } else {
          console.log('🔍 Loaded verification status from localStorage: not verified');
        }
      }
    } catch (error) {
      console.error('Error checking MiniKit installation:', error);
      setIsWorldApp(false);
    }
  }, []);

  const verifyUser = useCallback(
    async (signal?: string): Promise<boolean> => {
      setIsVerifying(true);
      setError(null);

      console.log('🔍 Starting verification flow', {
        isWorldApp,
        action,
        signal: signal || defaultSignal,
        env: process.env.NODE_ENV
      });

      try {
        // Try actual verification first if MiniKit is available at runtime,
        // regardless of isWorldApp flag which might be incorrect
        const isMiniKitAvailable = typeof window !== 'undefined' && 
          'MiniKit' in window && 
          typeof MiniKit.isInstalled === 'function' && 
          typeof MiniKit.commandsAsync?.verify === 'function';

        // If MiniKit is installed and verify function is available, attempt to use it
        if (isMiniKitAvailable && MiniKit.isInstalled()) {
          console.log('🔍 MiniKit is available and installed, attempting real verification');
          try {
            // Prepare verification payload according to documentation
            const verifyPayload: VerifyCommandInput = {
              action,
              signal: signal || defaultSignal,
              verification_level: VerificationLevel.Orb,
            };

            console.log('🔍 Calling MiniKit.commandsAsync.verify with payload:', verifyPayload);
            
            // Initiate verification as per documentation
            const result = await MiniKit.commandsAsync.verify(verifyPayload);
            console.log('🔍 Verification result:', result);
            
            const { finalPayload } = result;

            if (finalPayload.status === 'error') {
              const errorPayload = finalPayload as ErrorPayload;
              const errorMessage = errorPayload.message || 'Unknown verification error';
              console.error('Error payload', finalPayload);
              setError(errorMessage);
              return false;
            }

            // Verify the proof in the backend
            console.log('🔍 Sending proof to backend for verification');
            const verifyResponse = await fetch('/api/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                payload: finalPayload as ISuccessResult,
                action,
                signal: signal || defaultSignal,
              }),
            });

            const verifyResponseJson = await verifyResponse.json();
            console.log('🔍 Backend verification response:', verifyResponseJson);
            
            if (verifyResponseJson.status === 200) {
              console.log('✅ Verification success! Real World ID verification completed');
              setIsVerified(true);
              localStorage.setItem('worldid_verified', 'true');
              return true;
            } else {
              console.error('Verification failed:', verifyResponseJson);
              setError(`Verification failed: ${verifyResponseJson.verifyRes?.error || 'Server error'}`);
              return false;
            }
          } catch (verifyError) {
            console.error('Error during MiniKit verification:', verifyError);
            
            // Only fall back to development mode if this is a known MiniKit error
            if (process.env.NODE_ENV === 'development') {
              console.log('🔍 Falling back to development mode simulation after MiniKit error');
            } else {
              throw verifyError; // Re-throw for production
            }
          }
        }
        
        // For development outside of World App, simulate success
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Development mode: Simulating successful verification');
          setIsVerified(true);
          localStorage.setItem('worldid_verified', 'true');
          return true;
        } else {
          console.error('World App is not installed or accessible');
          throw new Error('World App is not installed or accessible. Please open this app in World App.');
        }
      } catch (error) {
        console.error('Error during verification:', error);
        setError(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
      } finally {
        setIsVerifying(false);
      }
    },
    [action, defaultSignal, isWorldApp]
  );

  return {
    isVerified,
    isVerifying,
    error,
    verifyUser,
    isWorldApp
  };
}
