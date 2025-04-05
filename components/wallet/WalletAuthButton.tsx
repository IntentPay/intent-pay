'use client';

import { useState } from 'react';
import { useMiniKit } from '@/lib/minikit-provider';
import { Button } from '@/components/ui/button';
import { truncateAddress } from '@/lib/utils';
import { Loader2, CheckCircle2, Wallet, User, Copy, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * WalletAuthButton component provides a UI for users to sign in with their Ethereum wallet
 * This component integrates with the MiniKitProvider to handle the Wallet Auth flow
 */
export default function WalletAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { 
    isWorldApp, 
    walletAddress, 
    isSignedIn, 
    signInWithWallet,
    username,
    profilePictureUrl,
    worldId
  } = useMiniKit();

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithWallet();
    } catch (error) {
      console.error('Failed to sign in with wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy wallet address to clipboard
  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // If we're not in World App, we could show an alternative flow or just disable the button
  if (!isWorldApp) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button 
          variant="secondary"
          className="w-full"
          disabled
        >
          <Wallet className="w-4 h-4 mr-2" />
          Need World App
        </Button>
        <p className="text-xs text-muted-foreground">
          Please use this feature in World App
        </p>
      </div>
    );
  }

  // If the user is already signed in, show the address and username if available
  if (isSignedIn && walletAddress) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-full p-2 bg-green-50 text-green-700 border border-green-200 rounded-md">
          <div className="flex items-center justify-between w-full">
            {/* User/World ID section */}
            <div className="flex items-center gap-1.5">
              <Avatar className="h-8 w-8 border border-white/20">
                {profilePictureUrl ? (
                  <AvatarImage src={profilePictureUrl} alt={username || 'User'} />
                ) : (
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex flex-col">
                {/* Display username if available */}
                {username && <span className="text-sm font-medium">{username}</span>}
                
                {/* Display World ID badge if available */}
                {worldId && (
                  <Badge variant="outline" className="px-2 py-0 h-5 text-xs gap-1 flex items-center">
                    <span className="bg-green-500 h-1.5 w-1.5 rounded-full"></span>
                    World ID
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Wallet address with copy functionality - separate button, not nested */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={copyToClipboard} 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 text-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="h-3 w-3" />
                        <span>{truncateAddress(walletAddress, 6, 4)}</span>
                        <Copy className="h-3 w-3 opacity-70" />
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copied ? 'Address copied!' : 'Copy wallet address'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Success wallet login
        </p>
      </div>
    );
  }

  // Default state: Not signed in
  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        variant="outline"
        className="w-full"
        onClick={handleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4 mr-2" />
            Use wallet login
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        Connect your wallet
      </p>
    </div>
  );
}
