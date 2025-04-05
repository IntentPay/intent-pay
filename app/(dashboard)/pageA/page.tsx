'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShoppingBag } from 'lucide-react';

export default function PageA() {
  const [isPaying, setIsPaying] = useState(false);

  const handleApplePay = async () => {
    setIsPaying(true);
    try {
      const payload = {
        recipient: '0x1234567890abcdef...',
        token: 'usdc',
        amount: '1.00',
        memo: 'Buy IntentPay Token',
        paymentMethod: 'apple_pay'
      };

      // const result = await window.miniApp.sendCommand('onepay/quick-action', payload);
      console.log('✅ Apple Pay Success:', true);
    } catch (err) {
      console.error('❌ Apple Pay Fail:', err);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto p-6 shadow-2xl rounded-2xl bg-white/90 backdrop-blur">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2 text-indigo-600">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <CardTitle className="text-2xl font-bold">Buy IntentPay Token</CardTitle>
        <CardDescription className="text-sm text-gray-600">Pay With Apple Pay</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <img src="/assets/tokens/usdc.svg" alt="IntentPay Token" className="w-24 h-24 rounded-full shadow-lg" />
        <div className="text-xl font-semibold text-gray-800">USDC$99</div>

        <Button
          size="lg"
          className="w-full bg-black text-white rounded-xl hover:bg-gray-800"
          onClick={handleApplePay}
          disabled={isPaying}
        >
          {isPaying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              process ...
            </>
          ) : (
            ' Use Apple Pay'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
