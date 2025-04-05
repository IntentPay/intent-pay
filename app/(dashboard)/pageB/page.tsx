'use client';

import React, { useState, useEffect } from 'react';
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput } from '@worldcoin/minikit-js';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Wallet } from 'lucide-react';

export default function PageB() {
  const [usdcAmount, setUsdcAmount] = useState(0);
  const [wldAmount, setWldAmount] = useState(0);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const conversionRate = 1.35; // 1 USDC = 1.35 WLD
    const calculatedWldAmount = usdcAmount * conversionRate;
    setWldAmount(calculatedWldAmount);
  }, [usdcAmount]);

  const sendPayment = async () => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    const payload: PayCommandInput = {
      reference: 'temp-id',
      to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Test address
      tokens: [
        {
          symbol: Tokens.WLD,
          token_amount: tokenToDecimals(wldAmount, Tokens.WLD).toString()
        }
      ],
      description: 'Pay for USDC purchase'
    };

    const { finalPayload } = await MiniKit.commandsAsync.pay(payload);

    if (finalPayload.status == 'success') {
      console.log('sendPayment successful!');
      setIsPaid(true); // For Dev test
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-muted px-2 sm:pt-20">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Wallet className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Buy USDC</CardTitle>
          <CardDescription>Use World Wallet For Payment</CardDescription>
        </CardHeader>

        <form onSubmit={sendPayment}>
          <CardContent className="space-y-4">
            <div
              className="rounded-xl p-5 text-white shadow-inner text-sm sm:text-base bg-cover bg-center"
              style={{
                backgroundImage: 'url("/assets/brushed-alum.png")',
                backgroundColor: '#2b2b2b'
              }}
            >
              <div className="opacity-90">World Wallet</div>
              <div className="text-xl font-semibold tracking-widest mt-3 opacity-95">**** **** **** 2045</div>
              <div className="mt-4 text-xs sm:text-sm break-all opacity-80">Paying to: 0xd8D...6045</div>
            </div>

            {/* USDC Amount Input */}
            <div className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-muted-foreground">Amount to Buy: (USDC)</span>
              <input
                type="number"
                min="0"
                step="0.001"
                value={usdcAmount}
                onChange={(e) => setUsdcAmount(parseFloat(e.target.value))}
                className="text-center text-lg font-semibold w-20 p-2 border border-gray-300 rounded"
              />
            </div>

            {/* Total WLD Calculation */}
            <div className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-muted-foreground">Total Cost: </span>
              <span className="font-semibold">{wldAmount.toFixed(4)} WLD</span>
            </div>
          </CardContent>

          <CardFooter className="mt-4">
            {isPaid ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Payment successful!
              </div>
            ) : (
              <Button type="submit" className="w-full bg-primary">
                Buy USDT
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
