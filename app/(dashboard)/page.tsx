'use client';

import { ArrowDownUp, ArrowUpRight, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { truncateAddress, formatCurrency } from '@/lib/utils';

// Mockup wallet data
const walletAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
const usdcBalance = 1250.75;
const transactions = [
  { id: 1, type: 'receive', amount: '+120 USDC', date: '2025-04-03', from: '0x1234...5678', status: 'completed' },
  { id: 2, type: 'send', amount: '-45 USDC', date: '2025-04-02', to: '0xabcd...efgh', status: 'completed' },
  { id: 3, type: 'swap', amount: 'ETH → USDC', date: '2025-04-01', value: '+230 USDC', status: 'completed' },
  { id: 4, type: 'send', amount: '-20 USDC', date: '2025-03-30', to: '0x9876...5432', status: 'pending' }
];

export default function WalletHomePage() {
  return (
    <div className="flex flex-col w-full max-w-md mx-auto gap-4 pb-20">
      {/* Wallet Header */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold">IntentPay</h1>
        <div className="mt-1 mb-4">
          <span className="text-sm opacity-80">Your gasless wallet for USDC transfers and intent trading</span>
        </div>

        {/* Wallet Balance */}
        <div className="text-3xl font-bold my-3">{formatCurrency(usdcBalance)}</div>

        <div className="flex items-center gap-1 bg-white/20 text-white px-3 py-1 rounded-full text-sm">
          <Wallet className="h-3 w-3" />
          <span>{truncateAddress(walletAddress, 6, 4)}</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between w-full mt-6">
          <Button
            variant="ghost"
            className="flex flex-col items-center bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 flex-1 mx-1"
          >
            <ArrowUpRight className="h-6 w-6 mb-1" />
            <span className="text-xs">Send</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 flex-1 mx-1"
          >
            <Plus className="h-6 w-6 mb-1" />
            <span className="text-xs">Receive</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 flex-1 mx-1"
          >
            <ArrowDownUp className="h-6 w-6 mb-1" />
            <span className="text-xs">Swap</span>
          </Button>
        </div>
      </div>

      {/* Activity Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Activity</CardTitle>
          <CardDescription>Your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="received">Received</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'receive'
                            ? 'bg-green-100 text-green-600'
                            : tx.type === 'send'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {tx.type === 'receive' ? (
                          <Plus className="h-5 w-5" />
                        ) : tx.type === 'send' ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownUp className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{tx.type}</div>
                        <div className="text-xs text-gray-500">{tx.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-medium ${
                          tx.type === 'receive'
                            ? 'text-green-600'
                            : tx.type === 'send'
                              ? 'text-red-600'
                              : 'text-blue-600'
                        }`}
                      >
                        {tx.amount}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tx.status === 'pending' ? '⏳ Pending' : '✓ Completed'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="sent" className="mt-4">
              <div className="space-y-4">
                {transactions
                  .filter((tx) => tx.type === 'send')
                  .map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                          <ArrowUpRight className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">Send</div>
                          <div className="text-xs text-gray-500">{tx.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-red-600">{tx.amount}</div>
                        <div className="text-xs text-gray-500">
                          {tx.status === 'pending' ? '⏳ Pending' : '✓ Completed'}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
            <TabsContent value="received" className="mt-4">
              <div className="space-y-4">
                {transactions
                  .filter((tx) => tx.type === 'receive')
                  .map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                          <Plus className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">Receive</div>
                          <div className="text-xs text-gray-500">{tx.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">{tx.amount}</div>
                        <div className="text-xs text-gray-500">
                          {tx.status === 'pending' ? '⏳ Pending' : '✓ Completed'}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="pt-0">
          <Button variant="outline" className="w-full">
            View All Transactions
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
