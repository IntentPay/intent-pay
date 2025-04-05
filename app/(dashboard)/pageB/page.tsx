'use client';

import React from 'react';
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput } from '@worldcoin/minikit-js';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Wallet } from 'lucide-react';

export default function PageB() {
  const [isPaid, setIsPaid] = React.useState(false);

  const sendPayment = async () => {
    const payload: PayCommandInput = {
      reference: 'temp-id',
      to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Test address
      tokens: [
        {
          symbol: Tokens.USDCE,
          token_amount: tokenToDecimals(0.5, Tokens.USDCE).toString()
        }
      ],
      description: 'Pay for IntentPay'
    };

    if (!MiniKit.isInstalled()) {
      return;
    }

    const { finalPayload } = await MiniKit.commandsAsync.pay(payload);

    if (finalPayload.status == 'success') {
      console.log('sendPayment successful !');
      setIsPaid(true);
      // const res = await fetch(`/api/confirm-payment`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(finalPayload)
      // });
      // const payment = await res.json();
      // if (payment.success) {
      //   // Congrats your payment was successful!
      // }
    }
  };
  return (
    <Card className="max-w-md mx-auto mt-10 p-4">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Wallet className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Crypto Payment</CardTitle>
        <CardDescription>Pay securely with your wallet</CardDescription>
      </CardHeader>

      <form onSubmit={sendPayment}>
        <CardContent className="space-y-4">
          {/* Credit Card / Wallet visual mock */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl p-4 text-white shadow-md">
            <div className="text-sm">IntentPay Wallet</div>
            <div className="text-lg font-bold tracking-wide mt-2">**** **** **** 2045</div>
            <div className="text-xs mt-4">Paying to: 0xd8...6045</div>
          </div>

          {/* Payment details */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-muted-foreground">Amount</div>
            <div className="font-semibold text-lg">$0.50 USDC</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-muted-foreground">Description</div>
            <div className="text-sm">Pay for IntentPay</div>
          </div>
        </CardContent>

        <CardFooter className="mt-4">
          {isPaid ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Payment successful!
            </div>
          ) : (
            <Button type="submit" className="w-full">
              Pay $0.50
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
