'use client';

import { MiniKit, VerifyCommandInput, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js'
import { ReactNode, useState, useEffect } from 'react';
import { useWorldID } from '@/lib/hooks/useWorldID';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, AlertTriangle, Check, Bug, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useMiniKit } from '@/lib/minikit-provider';

interface VerificationGateProps {
  children: ReactNode;
}

export function VerificationGate({ children }: VerificationGateProps) {
  const { error: worldIdError } = useWorldID();
  const { isWorldApp, isReady, error: minikitError, forceDevelopmentMode } = useMiniKit();
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [debugInfo, setDebugInfo] = useState('No debug info yet');
  const [userDebugInfo, setUserDebugInfo] = useState<string | null>(null);
  const { toast } = useToast();

  // Check World App environment and verification status - client-side only
  useEffect(() => {
    // Safely check if MiniKit is available
    const checkMiniKit = () => {
      try {
        // Ensure client-side execution only
        if (typeof window !== 'undefined') {
          let debugMessage = '';
          
          // Check if MiniKit exists in window object
          debugMessage += 'MiniKit exists: ' + ('MiniKit' in window) + '\n';
          debugMessage += 'MiniKit provider isWorldApp: ' + isWorldApp + '\n';
          debugMessage += 'MiniKit provider isReady: ' + isReady + '\n';
          debugMessage += 'MiniKit provider error: ' + (minikitError || 'none') + '\n';
          
          if ('MiniKit' in window) {
            debugMessage += 'MiniKit.isInstalled exists: ' + (typeof (window as any).MiniKit.isInstalled === 'function') + '\n';
            
            if (typeof (window as any).MiniKit.isInstalled === 'function') {
              try {
                const isInstalled = MiniKit.isInstalled();
                debugMessage += 'MiniKit.isInstalled(): ' + isInstalled + '\n';
              } catch (error: any) {
                debugMessage += 'Error calling MiniKit.isInstalled(): ' + (error?.message || String(error)) + '\n';
              }
            }
            
            // Check if MiniKit.user exists
            debugMessage += 'MiniKit.user exists: ' + ('user' in (window as any).MiniKit) + '\n';
            if ('user' in (window as any).MiniKit) {
              const userObj = (window as any).MiniKit.user;
              debugMessage += 'MiniKit.user value: ' + JSON.stringify(userObj, null, 2) + '\n';
              
              // Check if user has wallet info
              if (userObj && userObj.wallets && Array.isArray(userObj.wallets)) {
                debugMessage += 'MiniKit.user.wallets exists: Yes (count: ' + userObj.wallets.length + ')\n';
                userObj.wallets.forEach((wallet: any, index: number) => {
                  debugMessage += `Wallet ${index}: ${JSON.stringify(wallet, null, 2)}\n`;
                });
              } else {
                debugMessage += 'MiniKit.user.wallets exists: No\n';
              }
            }
            
            // Check walletAddress
            debugMessage += 'MiniKit.walletAddress exists: ' + ('walletAddress' in (window as any).MiniKit) + '\n';
            if ('walletAddress' in (window as any).MiniKit) {
              debugMessage += 'MiniKit.walletAddress value: ' + ((window as any).MiniKit.walletAddress || 'null') + '\n';
            }
            
            // Check getUserByAddress method
            debugMessage += 'MiniKit.getUserByAddress exists: ' + ('getUserByAddress' in (window as any).MiniKit) + '\n';
          }
          
          setDebugInfo(debugMessage);
        }
      } catch (error: any) {
        const errorMessage = '❌ Error checking MiniKit: ' + (error?.message || String(error));
        console.error(errorMessage);
        setDebugInfo(prev => prev + '\n' + errorMessage);
      }
    };

    // Check verification status in local storage
    const checkVerificationStatus = () => {
      try {
        if (typeof window !== 'undefined') {
          const storedVerificationStatus = localStorage.getItem('worldid_verified');
          if (storedVerificationStatus === 'true') {
            console.log('✅ User is already verified, allowing access');
            setIsVerified(true);
            
            // Load and display any saved user debug info
            const savedUserDebug = localStorage.getItem('worldid_user_debug');
            if (savedUserDebug) {
              setUserDebugInfo(savedUserDebug);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error reading verification status:', error);
      }
    };

    // Run checks
    checkMiniKit();
    checkVerificationStatus();
  }, [isWorldApp, isReady, minikitError]);

  const verifyPayload: VerifyCommandInput = {
    action: 'intent', // This is your action ID from the Developer Portal
    verification_level: VerificationLevel.Orb, // Orb | Device
  }

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      console.log('🔐 Attempting to verify user ID');
      
      // Use the MiniKit context to check if we're in World App
      if (!isWorldApp) {
        console.error('❌ Not running inside World App, but verify was called');
        setDebugInfo(prev => prev + '\nAttempted verification outside World App');
        
        toast({
          title: "Not in World App",
          description: "You're not currently in the World App. Please use Test Mode instead.",
          variant: "destructive",
          duration: 3000,
        });
        
        setIsVerifying(false);
        return;
      }
      
      try {
        // Try directly calling MiniKit.commandsAsync.verify
        const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);
        
        if (finalPayload.status === 'error') {
          console.log('❌ Error payload', finalPayload);
          toast({
            title: "Verification cancelled",
            description: "World ID verification was cancelled or failed",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }

        // Verify the proof in the backend
        const verifyResponse = await fetch('/api/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payload: finalPayload as ISuccessResult,
            action: 'intent',
          }),
        });

        // Handle verification response
        const verifyResponseJson = await verifyResponse.json();
        
        if (verifyResponseJson.status === 200) {
          console.log('✅ Verification successful');
          // Store verification status
          localStorage.setItem('worldid_verified', 'true');
          
          // Store user data if available
          try {
            // Get information about MiniKit properties
            const miniKit = (window as any).MiniKit;
            let userInfo = null;
            let userByAddressInfo = null;
            
            // Try to get user data using getUserByAddress if available
            if (miniKit.walletAddress && typeof miniKit.getUserByAddress === 'function') {
              try {
                console.log('🔍 Attempting to get user by address:', miniKit.walletAddress);
                userByAddressInfo = await miniKit.getUserByAddress(miniKit.walletAddress);
                console.log('✅ User data from getUserByAddress:', userByAddressInfo);
              } catch (getUserError) {
                console.error('❌ Error getting user by address:', getUserError);
              }
            }
            
            // Extract nullifier_hash from the verification payload
            const nullifierHash = (finalPayload as any).nullifier_hash;
            
            // This will hold all discovered addresses for debugging
            const discoveredAddresses: string[] = [];
            if (miniKit.walletAddress) {
              discoveredAddresses.push(`MiniKit.walletAddress: ${miniKit.walletAddress}`);
            }
            
            if (miniKit.user && miniKit.user.wallets) {
              miniKit.user.wallets.forEach((wallet: any, index: number) => {
                if (wallet.address) {
                  discoveredAddresses.push(`MiniKit.user.wallets[${index}].address: ${wallet.address}`);
                }
              });
            }
            
            if (userByAddressInfo && userByAddressInfo.wallets) {
              userByAddressInfo.wallets.forEach((wallet: any, index: number) => {
                if (wallet.address) {
                  discoveredAddresses.push(`userByAddressInfo.wallets[${index}].address: ${wallet.address}`);
                }
              });
            }
            
            // Save detailed debug information about MiniKit
            const userDebugData = `
MiniKit.user available: ${miniKit.user ? 'Yes' : 'No'}
MiniKit.user type: ${typeof miniKit.user}
MiniKit.user content: ${JSON.stringify(miniKit.user || {}, null, 2)}
MiniKit.walletAddress: ${miniKit.walletAddress || 'Not available'}
MiniKit.getUserByAddress available: ${typeof miniKit.getUserByAddress === 'function' ? 'Yes' : 'No'}
MiniKit.getUserByAddress result: ${JSON.stringify(userByAddressInfo || {}, null, 2)}
MiniKit properties: ${Object.keys(miniKit || {}).join(', ')}
All discovered addresses: ${discoveredAddresses.length > 0 ? '\n  - ' + discoveredAddresses.join('\n  - ') : 'None found'}
Payload from verification: ${JSON.stringify(finalPayload || {}, null, 2)}
`;
            
            setUserDebugInfo(userDebugData);
            localStorage.setItem('worldid_user_debug', userDebugData);
            
            if (!nullifierHash) {
              console.warn('⚠️ Could not find nullifier_hash in verification payload');
            }
            
            // IMPORTANT: Use nullifier_hash as the primary identifier since it's the most reliable
            const userData = {
              // The nullifier_hash is the most reliable ID for World ID users
              worldId: nullifierHash,
              
              // Try to get username from various sources
              username: (userByAddressInfo && userByAddressInfo.username) || 
                       (miniKit.user && miniKit.user.username) ||
                       'World ID User',
              
              // Since we don't have a reliable wallet address, we'll use the nullifier_hash 
              // as a fake address with 0x prefix to maintain compatibility
              address: miniKit.walletAddress || 
                      (miniKit.user && miniKit.user.wallets && miniKit.user.wallets[0]?.address) ||
                      '0x' + nullifierHash.substring(2),
              
              // Save profile picture if available
              profilePicture: (userByAddressInfo && userByAddressInfo.profilePicture) ||
                             (miniKit.user && miniKit.user.profilePicture) ||
                             '',
                             
              // Store the raw nullifier hash separately too
              nullifierHash: nullifierHash
            };

            console.log('💾 Saving World ID user data:', userData);
            localStorage.setItem('worldid_user', JSON.stringify(userData));
            
            // Show the nullifier hash in the UI toast for confirmation
            toast({
              title: "Verification successful",
              description: (
                <div>
                  <p>Your identity has been verified with World ID</p>
                  <p className="mt-2 text-xs font-mono break-all bg-slate-100 p-1 rounded">
                    ID: {nullifierHash ? nullifierHash.substring(0, 10) + '...' : 'Not available'}
                    {userData.username !== 'World ID User' ? 
                      <><br />Username: {userData.username}</> : ''}
                  </p>
                </div>
              ),
              variant: "default",
              duration: 5000,
            });
          } catch (userDataError) {
            console.error('❌ Error saving user data:', userDataError);
            
            // Create fallback user data as last resort
            const fallbackUserData = {
              worldId: 'verified_' + Math.random().toString(36).substring(2, 10),
              username: 'Verified User',
              address: ''
            };
            localStorage.setItem('worldid_user', JSON.stringify(fallbackUserData));
            
            toast({
              title: "Verification successful",
              description: "Your identity has been verified with World ID",
              variant: "default",
              duration: 3000,
            });
          }
          
          // Update state to allow access
          setIsVerified(true);
        } else {
          console.log('❌ Backend verification failed', verifyResponseJson);
          toast({
            title: "Verification failed",
            description: "Your identity could not be verified with World ID",
            variant: "destructive",
            duration: 3000,
          });
        }
      } catch (error: any) {
        console.error('❌ Error calling MiniKit.verify:', error);
        setDebugInfo(prev => prev + '\nError calling verify: ' + (error?.message || String(error)));
        
        toast({
          title: "Error",
          description: "Error during verification, please use Test Mode",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      setDebugInfo(prev => prev + '\nExternal error: ' + (error?.message || String(error)));
      
      toast({
        title: "Verification process error",
        description: "An unexpected error occurred during verification",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTestVerify = () => {
    console.log('🧪 Using test mode to bypass verification');
    
    // Safe check - ensure client-side execution only
    if (typeof window === 'undefined') return;
    
    // Directly set verification status in localStorage to simulate verification
    localStorage.setItem('worldid_verified', 'true');
    
    // Set mock user data for testing
    const mockUserData = {
      worldId: 'world_id_' + Math.random().toString(36).substring(2, 10),
      username: 'TestUser' + Math.floor(Math.random() * 1000),
      address: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
    };
    localStorage.setItem('worldid_user', JSON.stringify(mockUserData));

    toast({
      title: 'Test verification enabled',
      description: "You've bypassed verification using test mode",
      variant: 'default',
      duration: 3000
    });
    
    // Update state to allow access
    setIsVerified(true);
  };

  const forceWorldApp = () => {
    // Call the forceDevelopmentMode from MiniKit context instead
    forceDevelopmentMode();
    toast({
      title: "Development mode forced",
      description: "You can now test the app without World App verification",
      variant: "default",
      duration: 3000,
    });
  };

  const refreshDetection = () => {
    try {
      if (typeof window !== 'undefined') {
        let debugMessage = 'Refresh detection results:\n';
        
        // Check if MiniKit exists in window object
        debugMessage += 'MiniKit exists: ' + ('MiniKit' in window) + '\n';
        debugMessage += 'MiniKit provider isWorldApp: ' + isWorldApp + '\n';
        debugMessage += 'MiniKit provider isReady: ' + isReady + '\n';
        debugMessage += 'MiniKit provider error: ' + (minikitError || 'none') + '\n';
        
        if ('MiniKit' in window) {
          debugMessage += 'MiniKit.isInstalled exists: ' + (typeof (window as any).MiniKit.isInstalled === 'function') + '\n';
          
          if (typeof (window as any).MiniKit.isInstalled === 'function') {
            try {
              const isInstalled = MiniKit.isInstalled();
              debugMessage += 'MiniKit.isInstalled(): ' + isInstalled + '\n';
              // Removed setIsWorldApp since we're now using context
            } catch (error: any) {
              debugMessage += 'Error calling MiniKit.isInstalled(): ' + (error?.message || String(error)) + '\n';
            }
          }
          
          // Also check walletAddress and getUserByAddress
          const miniKit = (window as any).MiniKit;
          debugMessage += 'MiniKit.walletAddress: ' + (miniKit.walletAddress || 'Not available') + '\n';
          debugMessage += 'MiniKit.getUserByAddress available: ' + (typeof miniKit.getUserByAddress === 'function' ? 'Yes' : 'No') + '\n';
        }
        
        // Try detection via User-Agent
        const userAgent = navigator.userAgent || '';
        debugMessage += 'User-Agent: ' + userAgent + '\n';
        const isWorldAppUserAgent = userAgent.includes('WorldApp') || userAgent.includes('World App');
        debugMessage += 'Detected World App via User-Agent: ' + isWorldAppUserAgent + '\n';
        
        // Removed setIsWorldApp call - we're now using the context
        
        setDebugInfo(debugMessage);
        
        toast({
          title: "Detection refreshed",
          description: isWorldApp ? "World App environment detected" : "World App environment not detected",
          variant: isWorldApp ? "default" : "destructive",
          duration: 3000,
        });
      }
    } catch (error: any) {
      const errorMessage = '❌ Error refreshing detection: ' + (error?.message || String(error));
      console.error(errorMessage);
      setDebugInfo(errorMessage);
      
      toast({
        title: "Refresh detection failed",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // If user is verified, render children
  if (isVerified) {
    return (
      <>
        {/* Render children, but first check if we have debug info to display */}
        {userDebugInfo && (
          <div className="fixed bottom-4 right-4 z-50">
            {/* <Button 
              variant="outline" 
              className="mb-2"
              onClick={() => {
                toast({
                  title: "World ID Debug Info",
                  description: (
                    <div className="mt-2 max-h-[300px] overflow-auto">
                      <pre className="text-xs whitespace-pre-wrap bg-slate-100 p-2 rounded">
                        {userDebugInfo}
                      </pre>
                    </div>
                  ),
                  duration: 10000,
                });
              }}
            >
              <Bug className="h-4 w-4 mr-2" />
              Show World ID 
            </Button> */}
          </div>
        )}
        {children}
      </>
    );
  }

  // Otherwise show verification gate
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verification Required</CardTitle>
          <CardDescription>Please verify with World ID to access IntentPay</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {worldIdError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
              <p className="text-sm">{worldIdError}</p>
            </div>
          )}

          {!isWorldApp && (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-md">
              <p className="font-medium">You're not using World App</p>
              <p className="text-sm mt-1">
                For real verification, please open this app in World App. You can use Test Mode below to bypass verification.
              </p>
              <div className="mt-3 flex justify-between">
                <a
                  href="https://worldcoin.org/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-medium text-amber-800 hover:text-amber-900"
                >
                  Download World App
                </a>
                <Button 
                  onClick={forceWorldApp} 
                  variant="outline" 
                  size="sm"
                  className="text-xs border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  Force Enable Verification
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleVerify} 
              className="w-full" 
              size="lg"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify with World ID
                </>
              )}
            </Button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 flex-shrink text-xs text-gray-500">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <Button 
              onClick={handleTestVerify} 
              className="w-full" 
              variant="outline"
              size="lg"
            >
              <Bug className="mr-2 h-4 w-4" />
              Test Mode (Skip Verification)
            </Button>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700">Debug Information</p>
              <Button 
                onClick={refreshDetection} 
                variant="outline" 
                size="sm"
                className="h-7 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Refresh Detection
              </Button>
            </div>
            <pre className="text-xs bg-gray-100 p-2 rounded-md h-24 overflow-auto whitespace-pre-wrap">
              {debugInfo}
            </pre>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-md mt-4">
              <p className="text-sm font-medium flex items-center">
                <Check className="w-4 h-4 mr-2" />
                Development Mode
              </p>
              <p className="text-xs mt-1">
                You can use Test Mode to bypass verification completely.
              </p>
              <Button 
                onClick={forceDevelopmentMode} 
                variant="outline" 
                size="sm"
                className="text-xs border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                Force Development Mode
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
