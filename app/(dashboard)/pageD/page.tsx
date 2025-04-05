'use client';

import { useState, useEffect } from 'react';
import { 
  getERC20CurrentValue,
  getERC20Details,
  getProtocolsDetails
} from '@/lib/1inch/portfolio';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, ArrowRight, X } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Hardcoded chain information from intent-pay
const CHAIN_INFO = [
  {
    id: 1,
    name: "Ethereum",
    icon: "https://app.1inch.io/assets/images/network-logos/ethereum.svg"
  },
  {
    id: 56,
    name: "BNB Chain",
    icon: "https://app.1inch.io/assets/images/network-logos/bsc_2.svg"
  },
  {
    id: 137,
    name: "Polygon",
    icon: "https://app.1inch.io/assets/images/network-logos/polygon_1.svg"
  },
  {
    id: 42161,
    name: "Arbitrum",
    icon: "https://app.1inch.io/assets/images/network-logos/arbitrum_2.svg"
  },
  {
    id: 100,
    name: "Gnosis",
    icon: "https://app.1inch.io/assets/images/network-logos/gnosis.svg"
  },
  {
    id: 10,
    name: "Optimism",
    icon: "https://app.1inch.io/assets/images/network-logos/optimism.svg"
  },
  {
    id: 8453,
    name: "Base",
    icon: "https://app.1inch.io/assets/images/network-logos/base.svg"
  },
  {
    id: 43114,
    name: "Avalanche",
    icon: "https://app.1inch.io/assets/images/network-logos/avalanche.svg"
  },
  {
    id: 324,
    name: "zkSync Era",
    icon: "https://app.1inch.io/assets/images/network-logos/zksync-era.svg"
  },
  {
    id: 59144,
    name: "Linea",
    icon: "https://app.1inch.io/assets/images/network-logos/linea.svg"
  }
];

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithDelay<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      retries++;
      if (error?.response?.status === 429 && retries < maxRetries) {
        console.log(`Rate limited, retry attempt ${retries} of ${maxRetries}`);
        await delay(1000);
        continue;
      }
      if (retries === maxRetries) {
        throw new Error(`Failed after ${maxRetries} retries: ${error.message}`);
      }
      throw error;
    }
  }
}

// Add mock data
const MOCK_DATA = {
  1: { // Ethereum
    erc20Balance: { totalValue: "5000.00" },
    erc20Details: [
      {
        symbol: "ETH",
        name: "Ethereum",
        balance: "2.5",
        value: "4500.00",
        priceUsd: "1800.00"
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        balance: "500",
        value: "500.00",
        priceUsd: "1.00"
      }
    ],
    protocolDetails: [
      { name: "Uniswap", type: "DEX", value: "1000.00" },
      { name: "Aave", type: "Lending", value: "2000.00" }
    ]
  },
  137: { // Polygon
    erc20Balance: { totalValue: "2000.00" },
    erc20Details: [
      {
        symbol: "MATIC",
        name: "Polygon",
        balance: "1000",
        value: "1000.00",
        priceUsd: "1.00"
      },
      {
        symbol: "USDT",
        name: "Tether USD",
        balance: "1000",
        value: "1000.00",
        priceUsd: "1.00"
      }
    ],
    protocolDetails: [
      { name: "QuickSwap", type: "DEX", value: "500.00" },
      { name: "Curve", type: "DEX", value: "800.00" }
    ]
  },
  56: { // BSC
    erc20Balance: { totalValue: "3000.00" },
    erc20Details: [
      {
        symbol: "BNB",
        name: "Binance Coin",
        balance: "5",
        value: "1500.00",
        priceUsd: "300.00"
      },
      {
        symbol: "CAKE",
        name: "PancakeSwap Token",
        balance: "100",
        value: "1500.00",
        priceUsd: "15.00"
      }
    ],
    protocolDetails: [
      { name: "PancakeSwap", type: "DEX", value: "1200.00" },
      { name: "Venus", type: "Lending", value: "800.00" }
    ]
  }
};

export default function PageD() {
  const [selectedChain, setSelectedChain] = useState<typeof CHAIN_INFO[0] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<{
    erc20Balance: any;
    erc20Details: any;
    protocolDetails: any;
  } | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);

  // Load wallet address from localStorage on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      setWalletAddress(savedAddress);
    }
  }, []);

  const fetchChainData = async (chainId: number) => {
    setLoading(true);
    setError('');
    setData(null);

    // Simulate API delay
    await delay(1000);

    // Use mock data or fallback to empty data
    const mockChainData = MOCK_DATA[chainId as keyof typeof MOCK_DATA] || {
      erc20Balance: { totalValue: "0.00" },
      erc20Details: [],
      protocolDetails: []
    };

    setData(mockChainData);
    setLoading(false);
    // Show summary popup when data is loaded
    setShowSummary(true);
  };

  const handleChainSelect = (chain: typeof CHAIN_INFO[0]) => {
    setSelectedChain(chain);
    fetchChainData(chain.id);
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Chain Portfolio</CardTitle>
          <CardDescription>
            {walletAddress ? 
              `Viewing portfolio for ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` :
              'Please connect your wallet to view portfolio'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CHAIN_INFO.map((chain) => (
              <Button
                key={chain.id}
                variant={selectedChain?.id === chain.id ? "default" : "outline"}
                className={`flex items-center gap-2 h-20 ${
                  selectedChain?.id === chain.id 
                    ? "text-white font-medium" 
                    : "text-primary hover:text-primary-foreground"
                }`}
                onClick={() => handleChainSelect(chain)}
                disabled={loading}
              >
                <Image
                  src={chain.icon}
                  alt={chain.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span>{chain.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* ERC20 Balances */}
          <Card>
            <CardHeader>
              <CardTitle>ERC20 Token Balances</CardTitle>
              <CardDescription>Total Value: ${data.erc20Balance.totalValue}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.erc20Details?.map((token: any, index: number) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{token.symbol}</p>
                      <p className="text-sm text-gray-500">{token.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{token.balance}</p>
                      <p className="text-sm text-gray-500">${token.value}</p>
                    </div>
                  </div>
                ))}
                {data.erc20Details.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No tokens found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Protocol Details */}
          <Card>
            <CardHeader>
              <CardTitle>Protocol Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.protocolDetails?.map((protocol: any, index: number) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{protocol.name}</p>
                      <p className="text-sm text-gray-500">{protocol.protocol}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <p className="font-medium">${protocol.value}</p>
                    </div>
                  </div>
                ))}
                {data.protocolDetails.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No protocol interactions found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image
                src={selectedChain?.icon || ''}
                alt={selectedChain?.name || ''}
                width={24}
                height={24}
                className="rounded-full"
              />
              {selectedChain?.name} Portfolio Summary
            </DialogTitle>
            <DialogDescription>
              Total Portfolio Value: ${data?.erc20Balance.totalValue}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Token Holdings</h4>
              <div className="grid gap-3">
                {data?.erc20Details.map((token: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">{token.symbol}</span>
                        <span className="text-sm text-muted-foreground">{token.name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">{token.balance}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Price</p>
                          <p className="font-medium">${token.priceUsd}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Value</p>
                          <p className="font-medium">${token.value}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowSummary(false)}
              className="text-primary hover:text-primary-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
