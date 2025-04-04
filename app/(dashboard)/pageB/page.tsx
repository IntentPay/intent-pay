'use client';

import React from 'react';
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput } from '@worldcoin/minikit-js';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    <Card>
      <CardHeader>
        <CardTitle>PageB</CardTitle>
        <CardDescription>View PageB</CardDescription>
      </CardHeader>
      <form onSubmit={sendPayment}>
        <CardContent></CardContent>
        <CardFooter className="flex justify-between gap-2">
          <Button type="submit" className="flex-1">
            Payment
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
