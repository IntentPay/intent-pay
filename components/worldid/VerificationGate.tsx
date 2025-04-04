'use client';

import { MiniKit, VerifyCommandInput, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js'
import { ReactNode, useState } from 'react';
import { useWorldID } from '@/lib/hooks/useWorldID';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, AlertTriangle, Check, Bug } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface VerificationGateProps {
  children: ReactNode;
}

export function VerificationGate({ children }: VerificationGateProps) {
  const { isVerified, isVerifying, verifyUser, error, isWorldApp } = useWorldID();
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const { toast } = useToast();

  const verifyPayload: VerifyCommandInput = {
	action: 'intent', // This is your action ID from the Developer Portal
	verification_level: VerificationLevel.Orb, // Orb | Device
}

const handleVerify = async () => {
	if (!MiniKit.isInstalled()) {
		return
  }
  console.log('Verifying user with World ID');
	// World App will open a drawer prompting the user to confirm the operation, promise is resolved once user confirms or cancels
	const {finalPayload} = await MiniKit.commandsAsync.verify(verifyPayload)
		if (finalPayload.status === 'error') {
			return console.log('Error payload', finalPayload)
		}

		// Verify the proof in the backend
		const verifyResponse = await fetch('/api/verify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
			payload: finalPayload as ISuccessResult, // Parses only the fields we need to verify
			action: 'intent',
		}),
	})

	// TODO: Handle Success!
	const verifyResponseJson = await verifyResponse.json()
	if (verifyResponseJson.status === 200) {
    // Directly set verification status in localStorage to simulate verification
    localStorage.setItem('worldid_verified', 'true');
    
    toast({
      title: "Verification successful",
      description: "Your identity has been verified with World ID",
      variant: "default",
      duration: 3000,
    });
    
    // Force refresh to apply the verification status
    window.location.reload();
  } else {
    toast({
      title: "Verification failed",
      description: "Your identity could not be verified with World ID",
      variant: "destructive",
      duration: 3000,
    });
  }
}

  const handleTestVerify = () => {
    // Directly set verification status in localStorage to simulate verification
    localStorage.setItem('worldid_verified', 'true');
    
    toast({
      title: "Test verification enabled",
      description: "You've bypassed verification using test mode",
      variant: "default",
      duration: 3000,
    });
    
    // Force refresh to apply the verification status
    window.location.reload();
  };

  if (isVerified) {
    return <>{children}</>;
  }

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
          <CardDescription>
            Please verify with World ID to access IntentPay
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!isWorldApp && (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-md">
              <p className="font-medium">You're not using World App</p>
              <p className="text-sm mt-1">
                This application requires World App to verify your identity. Please open this app in World App.
              </p>
              <a 
                href="https://worldcoin.org/download"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center text-sm font-medium text-amber-800 hover:text-amber-900"
              >
                Download World App
              </a>
            </div>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={handleVerify} 
              className="w-full" 
              size="lg"
              disabled={isVerifying || verificationInProgress}
            >
              {isVerifying || verificationInProgress ? (
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

          {process.env.NODE_ENV === 'development' && !isWorldApp && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-md mt-4">
              <p className="text-sm font-medium flex items-center">
                <Check className="w-4 h-4 mr-2" />
                Development mode
              </p>
              <p className="text-xs mt-1">
                You can use either button to verify. The test mode button will bypass verification completely.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
