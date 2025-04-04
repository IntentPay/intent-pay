'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useWorldID } from '@/lib/hooks/useWorldID';
import { Loader2 } from 'lucide-react';

interface VerifyBannerProps {
  onVerified?: () => void;
  className?: string;
}

export function VerifyBanner({ onVerified, className = '' }: VerifyBannerProps) {
  const { isVerified, isVerifying, error, verifyUser, isWorldApp } = useWorldID();
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        title: 'Verification Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleVerify = async () => {
    const success = await verifyUser();
    if (success && onVerified) {
      onVerified();
    }
  };

  // Don't show the banner if already verified
  if (isVerified) return null;

  return (
    <Card className={`bg-amber-50 border-amber-200 ${className}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-amber-800 font-medium">Verify with World ID</p>
          <p className="text-amber-700 text-sm">
            {isWorldApp 
              ? 'Verify your identity to unlock all features'
              : 'Please open this app in World App to verify'}
          </p>
        </div>
        <Button
          onClick={handleVerify}
          disabled={isVerifying || !isWorldApp}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Now'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
