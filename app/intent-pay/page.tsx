'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, Info, Check, ChevronDown, ArrowDown, Settings, QrCode, CircleX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Web3Avatar } from '@/components/wallet/Web3Avatar';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { QRScannerModal } from '@/components/qr/QRScanner';
import { MiniKit } from '@worldcoin/minikit-js';

// Send haptic feedback
const sendHapticHeavyCommand = () =>
  MiniKit.commands.sendHapticFeedback({
    hapticsType: 'impact',
    style: 'heavy'
  });

// Chain and token mapping relationship
const CHAIN_TOKEN_MAPPING = {
  '1': ['ETH', 'USDC', 'USDT', 'DAI'], // Ethereum
  '137': ['MATIC', 'USDC', 'USDT', 'DAI'], // Polygon
  '43114': ['AVAX', 'USDC', 'USDT'], // Avalanche
  '42161': ['ETH', 'USDC', 'USDT', 'DAI'], // Arbitrum
  '8453': ['ETH', 'USDC', 'USDT'], // Base
};

// Supported tokens list
const SUPPORTED_TOKENS = {
  'USDC': { symbol: 'USDC', name: 'USD Coin', decimals: 6, logo: '/assets/tokens/usdc.svg' },
  'ETH': { symbol: 'ETH', name: 'Ethereum', decimals: 18, logo: '/assets/tokens/eth.svg' },
  'MATIC': { symbol: 'MATIC', name: 'Polygon', decimals: 18, logo: '/assets/tokens/matic.svg' },
  'AVAX': { symbol: 'AVAX', name: 'Avalanche', decimals: 18, logo: '/assets/tokens/avax.svg' },
  'USDT': { symbol: 'USDT', name: 'Tether USD', decimals: 6, logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
  'DAI': { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png' },
};

// Supported chains list
const SUPPORTED_CHAINS = [
  { id: '1', name: 'Ethereum', logo: '/assets/chains/ethereum.svg' },
  { id: '137', name: 'Polygon', logo: '/assets/chains/polygon.svg' },
  { id: '43114', name: 'Avalanche', logo: '/assets/chains/avalanche.svg' },
  { id: '42161', name: 'Arbitrum', logo: '/assets/chains/arbitrum.svg' },
  { id: '8453', name: 'Base', logo: '/assets/chains/base.svg' },
];

// Default slippage
const DEFAULT_SLIPPAGE = 0.5;

// Truncate address display
const truncateAddress = (address: string, start = 6, end = 4) => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

// Component wrapping useSearchParams
function IntentPayContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Get address param from URL
  const addressParam = searchParams.get('address');
  
  // State management
  const [recipientAddress, setRecipientAddress] = useState(addressParam || '');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [selectedChainId, setSelectedChainId] = useState('1'); // Default to Ethereum
  const [toToken, setToToken] = useState<any>(null);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [estimatedReceived, setEstimatedReceived] = useState('0');
  const [fee, setFee] = useState('0');
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // Get current selected chain
  const selectedChain = SUPPORTED_CHAINS.find(chain => chain.id === selectedChainId);
  
  // Get available tokens for current chain
  const availableTokens = selectedChainId 
    ? CHAIN_TOKEN_MAPPING[selectedChainId as keyof typeof CHAIN_TOKEN_MAPPING].map(symbol => SUPPORTED_TOKENS[symbol as keyof typeof SUPPORTED_TOKENS])
    : [];
  
  // Initialize with first available token
  useEffect(() => {
    if (availableTokens.length > 0 && !toToken) {
      setToToken(availableTokens[0]);
    }
  }, [availableTokens, toToken]);
  
  // Calculate estimated receipt amount based on amount and fees
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount)) && toToken) {
      // Simple simulation - would need actual API for real rates
      const amountNum = parseFloat(amount);
      const fee = amountNum * 0.003; // 0.3% fee assumed
      setFee(fee.toFixed(toToken.decimals === 6 ? 2 : 4));
      setEstimatedReceived((amountNum - fee).toFixed(toToken.decimals === 6 ? 2 : 4));
    } else {
      setFee('0');
      setEstimatedReceived('0');
    }
  }, [amount, toToken]);
  
  // Handle slippage change
  const handleSlippageChange = (value: number) => {
    setSlippage(value);
    setShowSlippageSettings(false);
  };
  
  // Handle payment submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendHapticHeavyCommand();
    
    if (!recipientAddress) {
      toast({
        title: "Error",
        description: "Please enter a recipient address",
        variant: "destructive",
      });
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    // This would be the actual payment process - just simulating success
    setTimeout(() => {
      setPaymentSuccess(true);
    }, 1500);
    
    toast({
      title: "Processing Transaction",
      description: "Your transaction request is being processed...",
    });
  };
  
  // Select chain
  const handleChainSelect = (chainId: string) => {
    sendHapticHeavyCommand();
    setSelectedChainId(chainId);
    setShowChainSelector(false);
    // Reset token selection
    setToToken(null);
  };
  
  // Select token
  const handleTokenSelect = (token: any) => {
    setToToken(token);
    setShowTokenSelector(false);
  };
  
  // Handle QR scan result
  const handleQRResult = (result: string) => {
    if (result) {
      setRecipientAddress(result);
      setShowQRScanner(false);
      
      toast({
        title: "Address Scanned",
        description: `Address ${truncateAddress(result)} has been added`,
      });
    }
  };
  
  // Clear address input
  const clearAddress = () => {
    setRecipientAddress('');
  };
  
  if (paymentSuccess) {
    return (
      <div className="container max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-green-100 rounded-full p-4 mb-6">
          <Check className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-6 text-center">
          You have successfully paid {amount} USDC to {truncateAddress(recipientAddress)}, who will receive {estimatedReceived} {toToken?.symbol}
        </p>
        <div className="flex gap-4 w-full">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/" onClick={sendHapticHeavyCommand}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button className="flex-1" onClick={sendHapticHeavyCommand}>
            <Send className="mr-2 h-4 w-4" />
            New Payment
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-muted-foreground hover:text-foreground" onClick={sendHapticHeavyCommand}>
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-bold">Payment</h1>
        <div className="w-6"></div>
      </div>
      
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border mb-4">
        <form onSubmit={handleSubmit}>
          {/* Recipient address input */}
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">Recipient Address</div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Enter or paste wallet address"
                  className="w-full px-3 py-2 rounded-lg bg-accent/50 focus:bg-accent focus:outline-none"
                />
                {recipientAddress && (
                  <button 
                    type="button" 
                    onClick={clearAddress}
                    className="absolute right-12 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label="Clear recipient address"
                  >
                    <CircleX className="h-4 w-4" />
                  </button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 bg-accent/50 hover:bg-accent"
                  onClick={() => setShowQRScanner(true)}
                  aria-label="Scan QR code for address"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
              
              {recipientAddress && (
                <div className="flex items-center gap-2 mt-2 px-2">
                  <Web3Avatar address={recipientAddress} size={24} />
                  <span className="text-sm">{truncateAddress(recipientAddress)}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Select target chain */}
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">Target Chain</div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowChainSelector(!showChainSelector)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                aria-label={`Select target blockchain, currently: ${selectedChain?.name || 'none selected'}`}
              >
                <div className="flex items-center gap-2">
                  {selectedChain && (
                    <Image
                      src={selectedChain.logo}
                      alt={selectedChain.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  <span>{selectedChain?.name || 'Select Chain'}</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showChainSelector && (
                <div className="absolute left-0 right-0 mt-2 p-2 bg-background border border-border rounded-lg shadow-lg z-10">
                  <div className="text-sm text-muted-foreground px-2 py-1 border-b border-border mb-2">Select Chain</div>
                  {SUPPORTED_CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      type="button"
                      onClick={() => handleChainSelect(chain.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md ${
                        selectedChainId === chain.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                      }`}
                      aria-label={`Select ${chain.name} blockchain`}
                    >
                      <Image 
                        src={chain.logo}
                        alt={chain.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span>{chain.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Fixed sending token (USDC) with amount */}
          <div className="relative mb-4">
            <div className="flex flex-col bg-accent rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-muted-foreground">You Pay</div>
                {/* Could show balance here */}
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent border-none text-2xl font-medium outline-none w-[70%]"
                />
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background">
                  <Image 
                    src="/assets/tokens/usdc.svg"
                    alt="USDC"
                    width={24}
                    height={24}
                    className="rounded-full"
                    onError={(e) => {
                      // Fallback to external URL if local image fails
                      (e.target as HTMLImageElement).src = "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png";
                    }}
                  />
                  <span>USDC</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recipient token selection */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-accent/50 p-1 rounded-full">
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          
          <div className="relative mb-4">
            <div className="flex flex-col bg-accent rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-muted-foreground">Recipient Gets (Estimated)</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-medium">
                  {estimatedReceived} 
                </div>
                <button
                  type="button"
                  onClick={() => setShowTokenSelector(!showTokenSelector)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background hover:bg-background/80"
                >
                  {toToken && (
                    <Image 
                      src={toToken.logo}
                      alt={toToken.symbol}
                      width={24}
                      height={24}
                      className="rounded-full"
                      onError={(e) => {
                        // Fallback to external URL if local image fails
                        const symbol = toToken.symbol.toLowerCase();
                        (e.target as HTMLImageElement).src = `https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png`;
                      }}
                    />
                  )}
                  <span>{toToken?.symbol || 'Select'}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {showTokenSelector && (
              <div className="absolute left-0 right-0 mt-2 p-2 bg-background border border-border rounded-lg shadow-lg z-10">
                <div className="text-sm text-muted-foreground px-2 py-1 border-b border-border mb-2">Select Token</div>
                {availableTokens.map((token) => (
                  <button
                    key={token.symbol}
                    type="button"
                    onClick={() => handleTokenSelect(token)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md ${
                      toToken?.symbol === token.symbol ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                    }`}
                  >
                    <Image 
                      src={token.logo}
                      alt={token.symbol}
                      width={24}
                      height={24}
                      className="rounded-full"
                      onError={(e) => {
                        // Fallback to external URL if local image fails
                        (e.target as HTMLImageElement).src = `https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png`;
                      }}
                    />
                    <span>{token.name}</span>
                    <span className="text-muted-foreground ml-1">({token.symbol})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Transaction details */}
          <div className="flex flex-col bg-accent/50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm">Transaction Fee</div>
              <div className="text-sm">{fee} USDC</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm flex items-center gap-1">
                <span>Slippage Tolerance</span>
                <button
                  type="button"
                  onClick={() => setShowSlippageSettings(!showSlippageSettings)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Adjust slippage tolerance settings"
                >
                  <Settings className="h-3 w-3" />
                </button>
              </div>
              <div className="text-sm">{slippage}%</div>
            </div>
          </div>
          
          {/* Slippage settings */}
          {showSlippageSettings && (
            <div className="bg-background border border-border rounded-lg p-4 mb-4">
              <div className="text-sm mb-2">Adjust Slippage Tolerance</div>
              <div className="flex gap-2">
                {[0.1, 0.5, 1.0, 2.0].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleSlippageChange(value)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      slippage === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent hover:bg-accent/80'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={!recipientAddress || !amount || !toToken || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0}
          >
            Confirm Payment
          </Button>
        </form>
      </div>
      
      <div className="p-4 bg-blue-50 text-blue-700 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium mb-1">Cross-Chain Payment</p>
          <p>IntentPay automatically handles cross-chain swaps and transfers. You don't need to worry about technical details. The system will optimize for the best exchange rate.</p>
        </div>
      </div>
      
      {/* QR code scanner modal */}
      {showQRScanner && (
        <QRScannerModal 
          onClose={() => setShowQRScanner(false)} 
          onResult={handleQRResult}
        />
      )}
    </div>
  );
}

// Main page component
export default function IntentPayPage() {
  return (
    <Suspense fallback={<div className="container max-w-md mx-auto p-4 flex justify-center items-center h-[70vh]">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>}>
      <IntentPayContent />
    </Suspense>
  );
}
