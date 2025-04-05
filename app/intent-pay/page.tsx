'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User2, 
  Send, 
  Info, 
  Check, 
  ChevronDown, 
  ArrowDown, 
  ArrowLeft, 
  Settings, 
  QrCode, 
  CircleX, 
  Search, 
  Loader2, 
  Wallet, 
  CreditCard,
  X,
  CheckCircle,
  AlertCircle,
  Clipboard,
  ChevronsUpDown,
  Globe,
  Loader,
  DollarSign,
  ScanLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Web3Avatar } from '@/components/wallet/Web3Avatar';
import { SendForm } from '@/components/SendForm';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SUPPORTED_CHAINS, CHAIN_NAMES } from '@/lib/1inch/config';
import Image from 'next/image';
import ApplePayButton from '@/components/applePay/ApplePay';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { getMultiChainTokenList, getTokensByChain, TokenInfoDto, getUsdcTokenInfo } from '@/lib/1inch/token';
import { useToast } from '@/components/ui/use-toast';
import { QRScannerModal } from '@/components/qr/QRScanner';
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput } from '@worldcoin/minikit-js';
import { searchTokensApi } from '@/lib/1inch/token';
import { getQuote, convertToTokenUnits, QuoteOutput } from '@/lib/1inch/quote';

// Send haptic feedback
const sendHapticHeavyCommand = () =>
  MiniKit.commands.sendHapticFeedback({
    hapticsType: 'impact',
    style: 'heavy'
  });

// Default slippage
const DEFAULT_SLIPPAGE = 0.5;

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
  const [selectedChainId, setSelectedChainId] = useState<number>(8453); // Default to Base chain
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [estimatedReceived, setEstimatedReceived] = useState('0');
  const [fee, setFee] = useState('0');
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [sourceTokenInfo, setSourceTokenInfo] = useState<TokenInfoDto | null>(null);
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteData, setQuoteData] = useState<QuoteOutput | null>(null);
  const [destinationChainId, setDestinationChainId] = useState<number>(137); // Default to Polygon
  
  // Token states
  const [availableTokens, setAvailableTokens] = useState<TokenInfoDto[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<TokenInfoDto[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenInfoDto | null>(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState<string>('');
  const [tokenSearch, setTokenSearch] = useState<{
    loading: boolean;
    results: TokenInfoDto[];
  }>({ loading: false, results: [] });
  
  // Chain states
  const [availableChains, setAvailableChains] = useState<number[]>([8453, 137]);
  const [showDestinationChainSelector, setShowDestinationChainSelector] = useState(false);
  
  // Get current chain name
  const chainName = selectedChainId ? CHAIN_NAMES[selectedChainId.toString() as keyof typeof CHAIN_NAMES] : '';
  
  // Load USDC token info using 1inch API
  useEffect(() => {
    async function loadUsdcTokenInfo() {
      try {
        const usdcInfo = await getUsdcTokenInfo(selectedChainId);
        if (usdcInfo) {
          setSourceTokenInfo(usdcInfo);
        }
      } catch (error) {
        console.error('Error loading USDC token info:', error);
      }
    }
    
    loadUsdcTokenInfo();
  }, [selectedChainId]);
  
  // Load tokens when chain changes
  useEffect(() => {
    let isMounted = true;
    
    const loadTokens = async () => {
      setIsLoadingTokens(true);
      setTokenSearch({ loading: true, results: [] });
      
      try {
        const chainId = selectedChainId;
        
        if (tokenSearchQuery.trim()) {
          // Use search API
          const results = await searchTokensApi(tokenSearchQuery, chainId, 20);
          if (isMounted) {
            setTokenSearch({ loading: false, results: results });
          }
        } else {
          // Get all tokens for this chain
          const allTokens = await getTokensByChain(chainId);
          if (isMounted) {
            setAvailableTokens(allTokens);
            setFilteredTokens(allTokens);
            setTokenSearch({ loading: false, results: allTokens });
          }
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
        if (isMounted) {
          setTokenSearch({ loading: false, results: [] });
        }
      } finally {
        if (isMounted) {
          setIsLoadingTokens(false);
        }
      }
    };
    
    loadTokens();
    
    // Set default token (USDC) for the selected chain
    const setDefaultToken = async () => {
      try {
        const usdcToken = await getUsdcTokenInfo(selectedChainId);
        if (usdcToken) {
          setSelectedToken(usdcToken);
        }
      } catch (error) {
        console.error('Error setting default token:', error);
      }
    };
    
    setDefaultToken();
    
    return () => {
      isMounted = false;
    };
  }, [selectedChainId, tokenSearchQuery]);
  
  // Handle token search
  const handleTokenSearch = async (query: string) => {
    setTokenSearch({ loading: true, results: [] });
    
    try {
      if (query.trim()) {
        const results = await searchTokensApi(query, selectedChainId, 20);
        setTokenSearch({ loading: false, results: results });
      } else {
        // If no query, show all available tokens for this chain
        const allTokens = await getTokensByChain(selectedChainId);
        setTokenSearch({ loading: false, results: allTokens });
      }
    } catch (error) {
      console.error('Error searching tokens:', error);
      setTokenSearch({ loading: false, results: [] });
    }
  };
  
  // Calculate estimated receipt amount via 1inch API
  useEffect(() => {
    let isMounted = true;
    
    const fetchQuote = async () => {
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || !selectedToken) {
        setFee('0');
        setEstimatedReceived('0');
        setQuoteData(null);
        return;
      }
      
      setIsQuoteLoading(true);
      
      try {
        // Convert amount to token units
        const amountInUnits = convertToTokenUnits(amount, selectedToken.decimals);
        
        // Use a default wallet address for quoting purposes
        const defaultWalletAddress = '0x0000000000000000000000000000000000000000';
        
        // Get the quote
        const quote = await getQuote({
          srcChain: selectedChainId,
          dstChain: destinationChainId,
          srcTokenAddress: selectedToken.address,
          dstTokenAddress: selectedToken.address, // Same token on different chain
          amount: amountInUnits,
          walletAddress: defaultWalletAddress,
          enableEstimate: true
        });
        
        if (isMounted) {
          setQuoteData(quote);
          
          // Calculate the fee and estimated amount based on the quote
          const receivedAmount = parseFloat(quote.dstTokenAmount) / Math.pow(10, selectedToken.decimals);
          const feeAmount = parseFloat(amount) - receivedAmount;
          
          setEstimatedReceived(receivedAmount.toFixed(selectedToken.decimals === 6 ? 2 : 4));
          setFee(feeAmount.toFixed(selectedToken.decimals === 6 ? 2 : 4));
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        // Fallback to simple estimation if the API call fails
        if (isMounted) {
          const amountNum = parseFloat(amount);
          const fee = amountNum * 0.003; // 0.3% fee assumed
          setFee(fee.toFixed(selectedToken.decimals === 6 ? 2 : 4));
          setEstimatedReceived((amountNum - fee).toFixed(selectedToken.decimals === 6 ? 2 : 4));
        }
      } finally {
        if (isMounted) {
          setIsQuoteLoading(false);
        }
      }
    };
    
    // Debounce the quote fetch to avoid too many API calls
    const debounceTimeout = setTimeout(fetchQuote, 500);
    
    return () => {
      isMounted = false;
      clearTimeout(debounceTimeout);
    };
  }, [amount, selectedToken, selectedChainId, destinationChainId]);
  
  // Handle slippage change
  const handleSlippageChange = (value: number) => {
    setSlippage(value);
    setShowSlippageSettings(false);
  };
  
  // Handle payment submission with World ID
  const handleSubmit = async (e: FormEvent) => {
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
    
    if (!selectedToken) {
      toast({
        title: "Error",
        description: "Please select a token to receive",
        variant: "destructive",
      });
      return;
    }
    
    if (!MiniKit.isInstalled()) {
      toast({
        title: "Error",
        description: "World ID is not installed. Please install World App to continue.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Calculate WLD amount (example conversion rate 1 USDC = 1.35 WLD)
      const conversionRate = 1.35;
      const amountNum = parseFloat(amount);
      const wldAmount = amountNum * conversionRate;
      
      // Create World ID payment payload
      const payload: PayCommandInput = {
        reference: `intent-pay-${Date.now()}`,
        to: recipientAddress, // Send to recipient address
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(wldAmount, Tokens.WLD).toString()
          }
        ],
        description: `Pay ${amount} ${selectedToken.symbol} with ${wldAmount.toFixed(4)} WLD`
      };
      
      // Show processing toast
      toast({
        title: "Processing Transaction",
        description: "Waiting for World ID confirmation...",
      });
      
      // Send payment request to World ID
      const { finalPayload } = await MiniKit.commandsAsync.pay(payload);
      
      if (finalPayload.status === 'success') {
        console.log('World ID payment successful!', finalPayload);
        setPaymentSuccess(true);
        
        toast({
          title: "Payment Successful",
          description: "Your transaction has been submitted to receive {estimatedReceived} {selectedToken?.symbol} at {recipientAddress.substring(0, 6)}...{recipientAddress.substring(recipientAddress.length - 4)}",
          variant: "default",
        });
      } else {
        console.error('World ID payment failed:', finalPayload);
        
        toast({
          title: "Payment Failed",
          description: "World ID payment could not be processed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing World ID payment:', error);
      
      toast({
        title: "Payment Error",
        description: "An error occurred while processing your payment. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Select chain
  const handleChainSelect = (chainId: number) => {
    sendHapticHeavyCommand();
    setSelectedChainId(chainId);
    setShowChainSelector(false);
    setTokenSearchQuery('');
  };
  
  // Select token
  const handleTokenSelect = (token: TokenInfoDto) => {
    setSelectedToken(token);
    setShowTokenSelector(false);
  };
  
  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenSearchQuery(e.target.value);
  };
  
  // Handle QR scan result
  const handleQRResult = (result: string) => {
    if (result) {
      // 移除前缀并分离地址与链信息
      let cleanAddress = result.replace(/^ethereum:/i, '');
      
      // 检查是否有@符号（表示链信息）
      const parts = cleanAddress.split('@');
      if (parts.length > 1) {
        cleanAddress = parts[0];
        // 可以在这里处理链信息 parts[1]
        // 例如: const chainInfo = parts[1];
      }
      
      setRecipientAddress(cleanAddress);
      setShowQRScanner(false);
      
      toast({
        title: "Address Scanned",
        description: "Address has been added successfully",
      });
    }
  };
  
  // Clear address input
  const clearAddress = () => {
    setRecipientAddress('');
  };
  
  // Validate Ethereum address
  useEffect(() => {
    if (recipientAddress) {
      // 基本的以太坊地址验证
      const isValid = /^(0x)?[0-9a-fA-F]{40}$/.test(recipientAddress);
      setIsValidAddress(isValid);
    } else {
      setIsValidAddress(false);
    }
  }, [recipientAddress]);
  
  // Handle paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // 移除可能的前缀，如 "ethereum:"
        const cleanAddress = text.replace(/^ethereum:/i, '');
        setRecipientAddress(cleanAddress);
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };
  
  if (paymentSuccess) {
    return (
      <div className="container max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-4 mb-6">
          <Check className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          Your transaction has been submitted to receive {estimatedReceived} {selectedToken?.symbol} at{' '}
          {recipientAddress.substring(0, 6)}...{recipientAddress.substring(recipientAddress.length - 4)}
        </p>
        <Button
          onClick={() => window.location.href = '/'}
          variant="default"
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Return Home
        </Button>
      </div>
    );
  }
  
  // UI components from shadcn
  // If these components don't exist, we'll create placeholders
  const Separator = () => <div className="w-full h-px bg-[#2a3156] my-4"></div>;
  const Skeleton = ({ className }: { className?: string }) => (
    <div className={`bg-[#232853] animate-pulse rounded ${className || ''}`}></div>
  );
  
  // Fix the network logo type safety issue by explicitly defining valid chain IDs
  const SUPPORTED_CHAIN_IDS = [8453, 137] as const;
  type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number];

  // Network icon component
  const NetworkIcon = ({ chainId }: { chainId: number }) => {
    const networkName = CHAIN_NAMES[chainId.toString() as keyof typeof CHAIN_NAMES] || "Unknown";
    
    // Map chainId to icon path
    const getNetworkIconPath = (id: number) => {
      const chainMap: Record<number, string> = {
        8453: "/assets/chains/base.svg",  // Base
        137: "/assets/chains/polygon.svg"  // Polygon
      };
      
      return chainMap[id] || "";
    };
    
    const iconPath = getNetworkIconPath(chainId);
    
    return (
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 relative overflow-hidden rounded-full bg-[#232853]">
          {iconPath ? (
            <Image
              src={iconPath}
              width={20}
              height={20}
              alt={networkName}
              className="h-full w-full object-contain"
            />
          ) : (
            <Globe className="h-full w-full text-[#c2c6ff]" />
          )}
        </div>
        <span className="ml-2">{networkName}</span>
      </div>
    );
  };

  // Update comparisons to ensure types match - fix string/number comparisons
  const isSelectedToken = (tokenAddress: string) => {
    return selectedToken?.address.toLowerCase() === tokenAddress.toLowerCase();
  };

  // Update amount display to ensure consistent types
  const displayAmount = (val: string) => {
    const numVal = parseFloat(val);
    return !isNaN(numVal) ? numVal.toString() : '0';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d1129] to-[#10173a] pb-16">
      {/* 顶部头像和背景 */}
      <div className="relative w-full h-[220px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#10173a] to-[#0d1129] opacity-90 z-10"></div>
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] bg-repeat opacity-20 z-20 data-stream-bg"></div>
        <div className="relative z-30 h-full flex flex-col justify-end p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="mr-2 text-white hover:bg-[#232853] button-secondary">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-white">
                IntentPay
              </h1>
              <p className="text-[#8a8dbd] mt-1">Secure Web3 Payment System</p>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="container max-w-lg mx-auto px-4 -mt-6">
        <div className="bg-[#10173a] border border-[#2a3156] rounded-xl p-6 shadow-[0_0_20px_rgba(0,240,255,0.15)] card-hover neon-pulse">
          {/* 交易表格 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 bg-gradient-to-r from-[#00f0ff] to-[#05ffa1] bg-clip-text text-transparent neon-text">
              Payment Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#8a8dbd]">Network</span>
                <span className="text-white font-medium flex items-center">
                  <span className="h-2 w-2 rounded-full bg-[#05ffa1] mr-2 animate-pulse"></span>
                  Base
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a8dbd]">Gas Fee</span>
                <span className="text-white">{fee} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a8dbd]">Slippage</span>
                <span className="text-white">{slippage}%</span>
              </div>
              
              <div className="border-t border-[#2a3156] my-3 pt-3">
                <div className="flex justify-between">
                  <span className="text-[#c2c6ff] font-medium">Total Amount</span>
                  <span className="text-white font-medium hologram-text">
                    {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 
                      ? (parseFloat(amount) + parseFloat(fee)).toFixed(4)
                      : parseFloat(fee).toFixed(4)} USDC
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 支付详情输入和当前代币 */}
          <div className="space-y-6">
            {/* 收款地址输入区域 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="recipient-address" className="text-[#c2c6ff] text-sm font-medium neon-text">
                  Recipient Address
                </label>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-[#0074d9] hover:text-[#00a3e2] hover:bg-[#232853] px-2"
                    onClick={() => setShowQRScanner(true)}
                  >
                    <ScanLine className="h-4 w-4 mr-1" />
                    Scan
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-[#0074d9] hover:text-[#00a3e2] hover:bg-[#232853] px-2"
                    onClick={handlePasteClipboard}
                  >
                    <Clipboard className="h-4 w-4 mr-1" />
                    Paste
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Input
                  id="recipient-address"
                  type="text"
                  placeholder="ethereum:0x..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className={`bg-[#191d3e] border-[#2a3156] text-white focus:border-[#00f0ff] focus:ring-[#00f0ff] focus:ring-opacity-30 pr-10 input-focus ${!isValidAddress && recipientAddress ? "border-[#ff2a6d]" : ""}`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {recipientAddress && (
                    isValidAddress ? (
                      <CheckCircle className="h-5 w-5 text-[#05ffa1]" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-[#ff2a6d]" />
                    )
                  )}
                </div>
              </div>
              {!isValidAddress && recipientAddress && (
                <p className="text-[#ff2a6d] text-sm mt-1 pink-neon-text">Invalid Ethereum address</p>
              )}
            </div>
            
            {/* 金额输入和代币选择 */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-[#c2c6ff] text-sm font-medium block neon-text">
                Amount
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-[#191d3e] border-[#2a3156] text-white focus:border-[#00f0ff] focus:ring-[#00f0ff] focus:ring-opacity-30 pr-16 input-focus"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8a8dbd]">
                    USDC
                  </div>
                </div>
                <Button 
                  type="button" 
                  onClick={() => setShowTokenSelector(true)}
                  className="bg-[#232853] hover:bg-[#2a3156] text-[#c2c6ff] border border-[#2a3156] h-10 px-3 button-hover"
                >
                  <ChevronsUpDown className="h-4 w-4 mr-1" />
                  <span>Token</span>
                </Button>
              </div>
            </div>
            
            {/* Destination Chain and Settings */}
            <div className="flex gap-2 mb-4">
              <Button 
                type="button" 
                onClick={() => setShowDestinationChainSelector(true)}
                className="flex-1 bg-[#232853] hover:bg-[#2a3156] text-[#c2c6ff] border border-[#2a3156]"
                aria-label="Select destination chain"
                title="Select destination chain"
              >
                <NetworkIcon chainId={destinationChainId} />
                <span className="ml-2">Destination: {CHAIN_NAMES[destinationChainId.toString() as keyof typeof CHAIN_NAMES] || 'Select Network'}</span>
              </Button>
              <Button 
                type="button" 
                onClick={() => setShowSlippageSettings(true)}
                className="bg-[#232853] hover:bg-[#2a3156] text-[#c2c6ff] border border-[#2a3156] px-3"
                aria-label="Adjust slippage settings"
                title="Adjust slippage settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Payment options - replacing the Pay Now button */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button" 
                className="bg-[#0074d9] hover:bg-[#00a3e2] text-white font-medium py-5 transition-all duration-200"
                onClick={() => {}}
                disabled={!isValidAddress || !amount || parseFloat(amount) <= 0}
              >
                <Globe className="h-5 w-5 mr-2" />
                Pay with World
              </Button>
              <div>
                <ApplePayButton 
                  amount={amount ? parseFloat(amount) : 0}
                  label={`Pay ${amount || '0.00'} USDC`}
                  onSuccess={() => {
                    toast({
                      title: "Payment Successful",
                      description: "Your payment was processed successfully!",
                      variant: "default",
                    });
                    
                    // Reset form after successful payment
                    setAmount('');
                    setRecipientAddress('');
                  }}
                  onError={() => {
                    toast({
                      title: "Payment Failed",
                      description: "There was an error processing your payment. Please try again.",
                      variant: "destructive",
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 代币选择模态框 */}
      {showTokenSelector && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#191d3e] border border-[#2a3156] rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 glass-effect max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-white">Select Token</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-[#8a8dbd] hover:text-white hover:bg-[#232853]"
                onClick={() => setShowTokenSelector(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative mb-4">
              <Input
                type="text"
                placeholder="Search tokens..."
                value={tokenSearchQuery}
                onChange={(e) => {
                  setTokenSearchQuery(e.target.value);
                  handleTokenSearch(e.target.value);
                }}
                className="bg-[#232853] border-[#2a3156] text-white focus:border-[#0074d9] focus:ring-[#0074d9] focus:ring-opacity-30"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8a8dbd]" />
            </div>
            <div className="token-selector-area custom-scrollbar">
              <div className="space-y-2">
                {tokenSearch.loading ? (
                  <div className="py-10 flex flex-col items-center justify-center text-[#8a8dbd]">
                    <Loader className="h-10 w-10 animate-spin mb-2" />
                    <p>Searching tokens...</p>
                  </div>
                ) : tokenSearch.results.length > 0 ? (
                  tokenSearch.results.map((token) => (
                    <button
                      key={token.address}
                      type="button"
                      className={`flex items-center justify-between w-full p-3 rounded-lg text-left transition-all ${
                        isSelectedToken(token.address) 
                          ? 'bg-[#0074d9]/20 border border-[#0074d9]'
                          : 'bg-[#232853] border border-[#2a3156] hover:border-[#0074d9]'
                      }`}
                      onClick={() => handleTokenSelect(token)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#30365c] flex items-center justify-center overflow-hidden">
                          {token.logoURI ? (
                            <img src={token.logoURI} alt={token.symbol} className="h-full w-full object-contain" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-[#c2c6ff]" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">{token.symbol}</div>
                          <div className="text-xs text-[#8a8dbd]">{token.name}</div>
                        </div>
                      </div>
                      {isSelectedToken(token.address) && (
                        <Check className="h-5 w-5 text-[#0074d9]" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="py-10 flex flex-col items-center justify-center text-[#8a8dbd]">
                    <Search className="h-10 w-10 mb-2" />
                    <p>No tokens found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 滑点设置模态框 */}
      {showSlippageSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#191d3e] border border-[#2a3156] rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 glass-effect">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-white neon-text">Transaction Settings</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-[#8a8dbd] hover:text-white hover:bg-[#232853] button-hover"
                onClick={() => setShowSlippageSettings(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[#c2c6ff] font-medium block mb-2 neon-text">Slippage Tolerance</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0.1, 0.5, 1.0, 5.0].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`rounded-md p-2 text-center ${
                        slippage === value
                          ? 'bg-gradient-to-r from-[#00f0ff] to-[#05ffa1] text-[#080f36] font-medium'
                          : 'bg-[#10173a] border border-[#2a3156] text-[#c2c6ff]'
                      } button-hover`}
                      onClick={() => setSlippage(value)}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="text-[#c2c6ff] font-medium block mb-2 neon-text">Custom Slippage</label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      value={slippage}
                      onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                      className="bg-[#10173a] border-[#2a3156] text-white focus:border-[#00f0ff] focus:ring-[#00f0ff] focus:ring-opacity-30 pr-10 input-focus"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8a8dbd]">
                      %
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-[#c2c6ff] font-medium block mb-2 neon-text">Transaction Fee</label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="bg-[#10173a] border-[#2a3156] text-white focus:border-[#00f0ff] focus:ring-[#00f0ff] focus:ring-opacity-30 pr-14 input-focus"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8a8dbd]">
                    USDC
                  </div>
                </div>
              </div>
            </div>
            <Button 
              type="button" 
              className="w-full bg-gradient-to-r from-[#00f0ff] to-[#05ffa1] hover:opacity-90 text-[#080f36] font-medium transition-all duration-200 mt-4 button-hover"
              onClick={() => setShowSlippageSettings(false)}
            >
              Confirm Settings
            </Button>
          </div>
        </div>
      )}

      {/* QR扫描模态框 */}
      {showQRScanner && (
        <QRScannerModal 
          onClose={() => setShowQRScanner(false)}
          onResult={(result: string) => {
            // Handle ETH address format
            if (result) {
              // Extract Ethereum address from various formats
              // ethereum:0x... format
              if (result.startsWith('ethereum:')) {
                setRecipientAddress(result.replace('ethereum:', ''));
              } else if (result.match(/^0x[a-fA-F0-9]{40}$/)) {
                // Direct address format
                setRecipientAddress(result);
              } else {
                // Try to extract address from other formats
                const addressMatch = result.match(/0x[a-fA-F0-9]{40}/);
                if (addressMatch) {
                  setRecipientAddress(addressMatch[0]);
                } else {
                  toast({
                    title: "Invalid QR Code",
                    description: "The scanned QR code doesn't contain a valid Ethereum address.",
                    variant: "destructive",
                  });
                }
              }
            }
          }}
        />
      )}
      
      {/* Destination Chain Selector Modal */}
      {showDestinationChainSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1c2040] rounded-xl p-4 w-80 max-w-full relative">
            <button
              type="button"
              onClick={() => setShowDestinationChainSelector(false)}
              className="absolute top-2 right-2 text-[#8a8dbd] hover:text-white"
              aria-label="Close destination chain selector"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-medium text-lg mb-3 text-white">Select Destination Network</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {availableChains.map((chainId) => (
                <button
                  key={chainId}
                  type="button"
                  className={`flex items-center justify-between w-full p-3 rounded-lg text-left transition-all ${
                    destinationChainId === chainId
                      ? 'bg-[#0074d9]/20 border border-[#0074d9]'
                      : 'bg-[#232853] border border-[#2a3156] hover:border-[#0074d9]'
                  }`}
                  onClick={() => {
                    setDestinationChainId(chainId);
                    setShowDestinationChainSelector(false);
                  }}
                  aria-label={`Select ${CHAIN_NAMES[chainId.toString() as keyof typeof CHAIN_NAMES]} as destination chain`}
                  title={`Select ${CHAIN_NAMES[chainId.toString() as keyof typeof CHAIN_NAMES]}`}
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-[#232853] flex items-center justify-center mr-3 overflow-hidden">
                      <NetworkIcon chainId={chainId} />
                    </div>
                    <span>{CHAIN_NAMES[chainId.toString() as keyof typeof CHAIN_NAMES]}</span>
                  </div>
                  {destinationChainId === chainId && (
                    <Check className="h-5 w-5 text-[#0074d9]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Transaction Quote Details */}
      <div className="bg-[#1c2040] p-6 rounded-lg shadow-inner mb-4">
        <div className="flex items-center justify-between mb-6">
          <span className="text-[#c2c6ff] font-medium text-lg">Transaction Details</span>
        </div>
        
        {/* Token Amount Info */}
        <div className="text-sm space-y-5 mt-4">
          <div className="flex justify-between items-center px-3 py-1">
            <span className="text-[#8a8dbd]">Amount:</span>
            <span className="font-medium">
              {isQuoteLoading ? (
                <div className="flex items-center">
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                `${amount || '0'} ${selectedToken?.symbol || 'USDC'}`
              )}
            </span>
          </div>
          <div className="flex justify-between items-center px-3 py-1">
            <span className="text-[#8a8dbd]">Network Fee:</span>
            <span className="font-medium">{fee} {selectedToken?.symbol || 'USDC'}</span>
          </div>
          <div className="flex justify-between items-center px-3 py-1">
            <span className="text-[#8a8dbd]">Est. received:</span>
            <span className="font-medium">{estimatedReceived} {selectedToken?.symbol || 'USDC'}</span>
          </div>
          {quoteData && (
            <>
              <div className="flex justify-between items-center px-3 py-1">
                <span className="text-[#8a8dbd]">Transfer Time:</span>
                <span className="font-medium">
                  {Math.ceil(quoteData.presets.fast.auctionDuration / 60)} minutes
                </span>
              </div>
              <div className="flex justify-between items-center px-3 py-1">
                <span className="text-[#8a8dbd]">Transaction Type:</span>
                <span className="font-medium">Cross-chain</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Main page component
export default function IntentPayPage() {
  return (
    <>
      {/* 添加防止左右滚动的样式 */}
      <style jsx global>{`
        html, body {
          overflow-x: hidden;
          width: 100%;
          position: relative;
        }
      `}</style>
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-[#00f0ff] border-t-transparent rounded-full"></div>
        </div>
      }>
        <IntentPayContent />
      </Suspense>
    </>
  );
}
