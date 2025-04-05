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
      setIsPaid(true); // TODO: For Dev test
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
    <div className="flex justify-center items-start min-h-screen bg-muted px-2 sm:pt-20">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Wallet className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">World Payment</CardTitle>
          <CardDescription>Pay securely with your wallet</CardDescription>
        </CardHeader>

        <form onSubmit={sendPayment}>
          <CardContent className="space-y-4">
            {/* 拉絲質感區塊 */}
            <div
              className="rounded-xl p-5 text-white shadow-inner text-sm sm:text-base bg-cover bg-center"
              style={{
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/brushed-alum.png")',
                backgroundColor: '#2b2b2b'
              }}
            >
              <div className="opacity-90">IntentPay Wallet</div>
              <div className="text-xl font-semibold tracking-widest mt-3 opacity-95">**** **** **** 2045</div>
              <div className="mt-4 text-xs sm:text-sm break-all opacity-80">Paying to: 0xd8D...6045</div>
            </div>

            {/* Payment Info */}
            <div className="flex items-center justify-between mt-4 text-sm sm:text-base">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">$0.50 USDC</span>
            </div>

            <div className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-muted-foreground">Description</span>
              <span>Pay for IntentPay</span>
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
    </div>
  );
}
