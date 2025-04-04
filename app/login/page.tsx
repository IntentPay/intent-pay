'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();

  // Optional: Auto-redirect to dashboard
  useEffect(() => {
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen flex justify-center items-start md:items-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">IntentPay</CardTitle>
          <CardDescription>
            A gasless wallet for USDC transfers and intent trading
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            className="w-full"
            onClick={() => router.push('/')}
          >
            Enter Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
