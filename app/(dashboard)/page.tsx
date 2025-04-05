'use client';

import { useState, useEffect } from 'react';
import { ArrowDownUp, ArrowUpRight, Plus, Wallet, User, Circle, Locate, CreditCard, Home, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { truncateAddress, formatCurrency } from '@/lib/utils';
import { MiniKit } from '@worldcoin/minikit-js';
import Link from 'next/link';

// User information type
interface WorldIDUser {
  worldId: string;
  username: string;
  address: string;
}

export default function WalletHomePage() {
  // State management for user information
  const [user, setUser] = useState<WorldIDUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [addressCopied, setAddressCopied] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Mockup wallet data (for development)
  const walletAddress = user?.address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
  const usdcBalance = walletBalance !== null ? walletBalance : 1250.75;
  const transactions = [
    { id: 1, type: 'receive', amount: '+120 USDC', date: '2025-04-03', from: '0x1234...5678', status: 'completed' },
    { id: 2, type: 'send', amount: '-45 USDC', date: '2025-04-02', to: '0xabcd...efgh', status: 'completed' },
    { id: 3, type: 'swap', amount: 'ETH → USDC', date: '2025-04-01', value: '+230 USDC', status: 'completed' },
    { id: 4, type: 'send', amount: '-20 USDC', date: '2025-03-30', to: '0x9876...5432', status: 'pending' }
  ];

  // Load user data from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('worldid_user');
        if (userData) {
          setUser(JSON.parse(userData));
        }

        // Also try to get the latest data from MiniKit
        if (MiniKit.isInstalled() && MiniKit.user) {
          console.log('MiniKit user:', MiniKit.user);
          
          // Try to get the wallet balance if available
          const fetchBalance = async () => {
            try {
              // @ts-ignore - MiniKit.getBalance may exist in newer versions but not in our type definitions
              if (typeof MiniKit.getBalance === 'function') {
                // @ts-ignore
                const balance = await MiniKit.getBalance();
                if (balance !== undefined && balance !== null) {
                  setWalletBalance(parseFloat(balance));
                  console.log('Wallet balance:', balance);
                }
              } else {
                console.log('MiniKit.getBalance is not available');
                
                // Alternative: Try to get balance from World Wallet if available
                // @ts-ignore - Using alternative API that might be available
                if (typeof MiniKit.worldWallet?.getBalance === 'function') {
                  try {
                    // @ts-ignore
                    const worldBalance = await MiniKit.worldWallet.getBalance();
                    if (worldBalance) {
                      setWalletBalance(parseFloat(worldBalance));
                      console.log('World Wallet balance:', worldBalance);
                    }
                  } catch (balanceError) {
                    console.warn('Error fetching World Wallet balance:', balanceError);
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching wallet balance:', error);
            }
          };
          
          fetchBalance();
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  // Function to copy the wallet address
  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto gap-4 pb-20">
      {/* Wallet Header */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg">
        {/* 移除 IntentPay 標題 */}

        {user && (
          <div className="mt-1 mb-3 flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">{user.username || 'World ID User'}</span>
          </div>
        )}

        {/* Wallet Balance */}
        <div className="text-3xl font-bold my-3">{formatCurrency(usdcBalance)}</div>

        <button 
          onClick={copyAddress}
          className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm transition-colors"
        >
          {addressCopied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Wallet className="h-3 w-3" />
              <span>{truncateAddress(walletAddress, 6, 4)}</span>
            </>
          )}
        </button>

        {/* Add World ID */}
        {user?.worldId && (
          <div className="mt-2 text-xs opacity-70">World ID: {truncateAddress(user.worldId, 6, 4)}</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" className="flex flex-col h-16 items-center justify-center">
          <Plus className="h-4 w-4 mb-1" />
          <span className="text-xs">Add USDC</span>
        </Button>
        <Button variant="outline" className="flex flex-col h-16 items-center justify-center">
          <ArrowUpRight className="h-4 w-4 mb-1" />
          <span className="text-xs">Send</span>
        </Button>
        <Link href="/swap" className="block col-span-1">
          <Button variant="outline" className="flex flex-col h-16 w-full items-center justify-center">
            <ArrowDownUp className="h-4 w-4 mb-1" />
            <span className="text-xs">Swap</span>
          </Button>
        </Link>
      </div>

      {/* Transactions */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="intents">Intents</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent transactions and activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <div className="font-medium">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</div>
                      <div className="text-sm text-gray-500">{tx.date}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${tx.type === 'receive' ? 'text-green-600' : ''}`}>{tx.amount}</div>
                      <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{tx.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Transactions
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="intents">
          <Card>
            <CardHeader>
              <CardTitle>Your Intents</CardTitle>
              <CardDescription>Trading intents you've created</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="text-center text-gray-500">
                <p>You haven't created any intents yet</p>
                <Button className="mt-4">Create Intent</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
