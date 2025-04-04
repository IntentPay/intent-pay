'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, truncateAddress } from '@/lib/utils';

interface WalletCardProps {
  address: string;
  balances: Array<{
    token: string;
    balance: string;
    blockchain: string;
  }>;
  onSend?: () => void;
  onSwap?: () => void;
}

export function WalletCard({ address, balances, onSend, onSwap }: WalletCardProps) {
  const [totalValue, setTotalValue] = useState<number>(0);

  // Calculate total wallet value (in a real app, this would use current token prices)
  useEffect(() => {
    // For demo purposes, we'll just sum the USDC balance as its face value
    const usdcBalance = balances.find(b => b.token === 'USDC')?.balance;
    setTotalValue(usdcBalance ? parseFloat(usdcBalance) : 0);
  }, [balances]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>My Wallet</span>
          <span className="text-lg font-medium">{formatCurrency(totalValue)}</span>
        </CardTitle>
        <CardDescription>{truncateAddress(address)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {balances.map((balance, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {balance.token.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{balance.token}</div>
                  <div className="text-xs text-gray-500">{balance.blockchain}</div>
                </div>
              </div>
              <div className="font-medium">{balance.balance}</div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={onSend} className="flex-1">Send</Button>
        <Button onClick={onSwap} variant="outline" className="flex-1">Swap</Button>
      </CardFooter>
    </Card>
  );
}
