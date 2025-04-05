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
import { getMultiChainTokenList, getTokensByChain, TokenInfoDto, getUsdcTokenInfo, USDC_ADDRESSES } from '@/lib/1inch/token';
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

// Format address function to truncate long addresses
const formatAddress = (address: string) => {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
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
  const [selectedChainId, setSelectedChainId] = useState<number>(8453); // Default to Base chain
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [estimatedReceived, setEstimatedReceived] = useState('0');
  const [fee, setFee] = useState('0');
  const [quoteData, setQuoteData] = useState<QuoteOutput | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenInfoDto | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');
  const [tokenSearch, setTokenSearch] = useState<{
    loading: boolean;
    results: TokenInfoDto[];
  }>({ loading: false, results: [] });
  const [allTokens, setAllTokens] = useState<TokenInfoDto[]>([]);
  const [hasLoadedAllTokens, setHasLoadedAllTokens] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false); // Keep loading state
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [sourceTokenInfo, setSourceTokenInfo] = useState<TokenInfoDto | null>(null);
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [destinationChainId, setDestinationChainId] = useState<number>(8453); // Default to Base
  
  // Chain states
  const [availableChains, setAvailableChains] = useState<number[]>([1, 56, 137, 42161, 100, 10, 8453, 43114, 324, 59144]);
  const [showDestinationChainSelector, setShowDestinationChainSelector] = useState(false);
  
  // Hardcoded chain information
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

  // 完整的链名称映射
  const CHAIN_NAMES: Record<string, string> = {
    "1": "Ethereum",
    "56": "BNB Chain",
    "137": "Polygon",
    "42161": "Arbitrum",
    "100": "Gnosis",
    "10": "Optimism",
    "8453": "Base", 
    "43114": "Avalanche",
    "324": "zkSync Era",
    "59144": "Linea"
  };

  // Get current chain name
  const chainName = selectedChainId ? CHAIN_NAMES[selectedChainId.toString() as keyof typeof CHAIN_NAMES] : '';
  
  // Load USDC token info using 1inch API
  useEffect(() => {
    setIsMounted(true);
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
  
  // Effect to update token list when selector opens or chain changes
  useEffect(() => {
    const loadAndFilterTokens = async () => {
      setIsLoadingTokens(true);
      let currentTokens = allTokens;

      // Fetch full list only if not already loaded
      if (!hasLoadedAllTokens) {
        try {
          const tokenListResponse = await getMultiChainTokenList();
          currentTokens = tokenListResponse.tokens;
          setAllTokens(currentTokens);
          setHasLoadedAllTokens(true);
        } catch (error) {
          console.error("Error fetching initial token list:", error);
          setTokenSearch({ loading: false, results: [] }); 
          setIsLoadingTokens(false);
          return; // Exit if initial fetch fails
        }
      }
      
      // Filter the (potentially newly fetched) list for the selected chain
      const filteredTokens = getTokensByChain(selectedChainId, { tokens: currentTokens });
      setTokenSearch({ loading: false, results: filteredTokens });
      setIsLoadingTokens(false);
    };

    if (showTokenSelector) {
      loadAndFilterTokens();
      setTokenSearchQuery(''); // Clear search query when opening
    }
  }, [showTokenSelector, selectedChainId, hasLoadedAllTokens, allTokens]); // Add dependencies

  // 处理Token搜索
  const handleTokenSearch = async (query: string) => {
    setTokenSearchQuery(query);
    
    if (query.trim() === '') {
      // If search is empty, filter the locally stored allTokens list
      setIsLoadingTokens(false); // No API call needed here
      const filteredTokens = getTokensByChain(selectedChainId, { tokens: allTokens });
      setTokenSearch({ loading: false, results: filteredTokens });
    } else {
      // Otherwise, use the search API
      setIsLoadingTokens(true);
      setTokenSearch({ loading: true, results: [] }); // Show loading
      try {
        const results = await searchTokensApi(query, selectedChainId, 20);
        setTokenSearch({ loading: false, results: results });
      } catch (error) {
        console.error('Error searching tokens:', error);
        setTokenSearch({ loading: false, results: [] });
      } finally {
        setIsLoadingTokens(false);
      }
    }
  };

  // Calculate estimated receipt amount via 1inch API
  useEffect(() => {
    let isMounted = true;
    
    const fetchTokenQuote = async () => {
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || !selectedToken) {
        setFee('0');
        setEstimatedReceived('0');
        return;
      }
      
      setIsQuoteLoading(true);
      
      try {
        // 确保金额转换为代币单位
        const tokenAmount = parseFloat(amount);
        // 我们仍然保留这个作为备用方案
        let exchangeRate = 1; // 默认1:1兑换率
        
        // 如果是ETH，根据当前市场价格进行转换 (假设ETH比USDC价值更高)
        if (selectedToken.symbol === 'ETH') {
          // 这里应该接入实际的价格API，但现在我们使用一个合理的预设值
          exchangeRate = 0.0003; // 假设1 USDC = 0.0003 ETH (或1 ETH = 约3333 USDC)
        } else if (selectedToken.symbol === 'WBTC') {
          exchangeRate = 0.00002; // 假设1 USDC = 0.00002 WBTC
        }
        
        // 获取USDC地址和目标代币地址
        const getTokenAddress = (chainId: number, symbol: string) => {
          // ETH 和 MATIC 的特殊地址
          if (symbol === 'ETH' || symbol === 'MATIC') {
            return '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
          }
          
          // 为USDC使用预定义的地址
          if (symbol === 'USDC') {
            const usdcAddress = USDC_ADDRESSES[chainId];
            if (usdcAddress) return usdcAddress;
          }
          
          // 默认返回所选代币的地址
          return selectedToken.address;
        };
        
        // 对于跨链交易，我们需要正确的源代币和目标代币
        const srcTokenAddress = getTokenAddress(selectedChainId, 'USDC'); // 源代币是USDC
        const dstTokenAddress = getTokenAddress(destinationChainId, selectedToken.symbol); // 目标代币是用户选择的代币
        
        console.log(`API request: srcChain=${selectedChainId}, srcToken=${srcTokenAddress}, dstChain=${destinationChainId}, dstToken=${dstTokenAddress}`);
        
        // 使用真实API调用，不使用测试模式
        const useTestMode = false; // 设置为false以使用真实API调用
        
        // 获取USDC的精度，USDC是6位小数
        const usdcDecimals = 6;
        
        // 调用1inch API获取报价
        const quote = await getQuote({
          srcChain: selectedChainId,
          dstChain: destinationChainId,
          amount: (tokenAmount * Math.pow(10, usdcDecimals)).toString(), // 使用USDC的6位小数精度
          srcTokenAddress: srcTokenAddress,
          dstTokenAddress: dstTokenAddress,
          walletAddress: '0x0000000000000000000000000000000000000000',
          enableEstimate: true,
          useTestData: useTestMode // 将测试模式关闭
        });
        
        if (isMounted) {
          setQuoteData(quote);
          
          let receivedAmount = 0;
          let adjustedFee = 0; // Default fee
          let finalAmount = 0; // Default final amount
          const feeAmountFromEstimate = tokenAmount * 0.003; // Fallback estimate fee
          const displayDecimals = selectedToken.symbol === 'ETH' ? 8 : 4; // Display decimals
          
          if (quote && quote.dstTokenAmount) {
            // Determine receivedAmount based on token type and decimals
            if (selectedToken.symbol === 'ETH') {
              const dstTokenAmountStr = quote.dstTokenAmount;
              const ethAmount = Number(dstTokenAmountStr) / Math.pow(10, 18);
              console.log('原始API返回的dstTokenAmount (ETH):', dstTokenAmountStr);
              console.log('转换为ETH (18位小数):', ethAmount);
              receivedAmount = ethAmount;
            } else {
              const dstDecimals = selectedToken.decimals;
              receivedAmount = parseFloat(quote.dstTokenAmount) / Math.pow(10, dstDecimals);
              console.log('原始API返回的dstTokenAmount (Other):', quote.dstTokenAmount);
              console.log('转换为代币单位:', receivedAmount);
            }
            
            // Fee calculation logic now runs *after* receivedAmount is set for all types
            const hasValidPresetCost = (
              q: QuoteOutput | null, 
              presetKey: string
            ): boolean => {
              if (!q || !q.presets) return false;
              
              // 安全地访问预设
              const preset = q.presets[presetKey as keyof typeof q.presets];
              return !!(preset && 'costInDstToken' in preset && preset.costInDstToken);
            };
            
            if (quote && 
                quote.recommendedPreset && 
                hasValidPresetCost(quote, quote.recommendedPreset)) {
              
              const recommendedPreset = quote.recommendedPreset as keyof typeof quote.presets;
              const preset = quote.presets[recommendedPreset]!;
              
              // Ensure correct decimals for fee calculation (ETH is 18)
              const feeCalcDecimals = selectedToken.symbol === 'ETH' ? 18 : selectedToken.decimals;
              const apiFeeCost = parseFloat(preset.costInDstToken!) / Math.pow(10, feeCalcDecimals);
              console.log('API fee cost (token units):', apiFeeCost);
              
              // --- New Fee Logic --- 
              const thresholdFee = receivedAmount * 0.05; // Calculate 5% threshold
              
              if (apiFeeCost < thresholdFee) {
                // If API fee is less than 5%, charge 5%
                adjustedFee = thresholdFee;
                console.log(`API fee (${apiFeeCost.toFixed(displayDecimals)}) is less than 5% threshold (${thresholdFee.toFixed(displayDecimals)}), charging threshold: ${adjustedFee.toFixed(displayDecimals)}`);
              } else {
                // If API fee is 5% or more, charge 1.2x the API fee
                adjustedFee = apiFeeCost * 1.2;
                console.log(`API fee (${apiFeeCost.toFixed(displayDecimals)}) is >= 5% threshold (${thresholdFee.toFixed(displayDecimals)}), charging 1.2x = ${adjustedFee.toFixed(displayDecimals)}`);
              }
              // --- End New Fee Logic ---
            } else {
              // 使用估算费用
              console.log('Using fallback estimated fee logic.');
              // Even in fallback, apply the adjusted fee logic if possible, otherwise use basic estimate
              // Note: This fallback fee logic might need refinement depending on desired behavior when API fee is missing
              adjustedFee = feeAmountFromEstimate * exchangeRate; // Basic estimate for fee
            }
            
            finalAmount = receivedAmount - adjustedFee;
            if (finalAmount < 0) finalAmount = 0;
            
            // Set state AFTER all calculations inside this block
            setEstimatedReceived(finalAmount.toFixed(displayDecimals));
            setFee(adjustedFee.toFixed(displayDecimals));
          } else {
            // Handle case where quote or dstTokenAmount is missing
            console.log('Quote or dstTokenAmount missing, using fallback exchange rate for calculation.');
            receivedAmount = tokenAmount * exchangeRate; // Use fallback rate
            const fee = tokenAmount * 0.003; // Basic fallback fee
            finalAmount = receivedAmount - fee * exchangeRate;
            if (finalAmount < 0) finalAmount = 0;
            // Set state in this fallback case
            setFee(fee.toFixed(displayDecimals));
            setEstimatedReceived(finalAmount.toFixed(displayDecimals));
          }
        }
      } catch (error: any) {
        console.error('Error fetching quote:', error);
        console.error('Error details:', error.details || 'No detailed error information available');
        
        // 显示错误通知
        toast({
          title: "获取报价失败",
          description: `API错误: ${error.message || '未知错误'}。使用估算值替代。`,
          variant: "destructive"
        });
        
        // Initialize finalAmount in catch block as well
        let finalAmount = 0; // Or handle based on error
        let receivedAmount = 0; // Reset receivedAmount
        
        // 使用简单估算作为API调用失败的后备方案
        if (isMounted) {
          const amountNum = parseFloat(amount);
          let exchangeRate = 1; // Default fallback rate
          
          // 如果是ETH，根据当前市场价格进行转换
          if (selectedToken.symbol === 'ETH') {
            exchangeRate = 0.0003; // Example: 1 USDC = 0.0003 ETH
          }
          // Add other fallback rates if needed, e.g., for WBTC
          // else if (selectedToken.symbol === 'WBTC') { ... }
 
          const fee = amountNum * 0.003; // 假设0.3%的费用
          receivedAmount = amountNum * exchangeRate; // Estimate receivedAmount in catch block
          finalAmount = receivedAmount - (fee * exchangeRate); // Assign to existing let
          if (finalAmount < 0) finalAmount = 0;
          
          setFee(fee.toFixed(selectedToken.decimals === 6 ? 4 : 6));
          setEstimatedReceived(finalAmount.toFixed(6));
        }
      } finally {
        if (isMounted) {
          setIsQuoteLoading(false);
        }
      }
    };
    
    // Debounce the quote fetch to avoid too many API calls
    const debounceTimeout = setTimeout(fetchTokenQuote, 500);
    
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
          description: `Your transaction has been submitted to receive ${estimatedReceived} ${selectedToken?.symbol} at ${formatAddress(recipientAddress)}`,
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
          Your transaction has been submitted to receive {estimatedReceived} {selectedToken?.symbol} at {formatAddress(recipientAddress)}
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
  const SUPPORTED_CHAIN_IDS = [1, 56, 137, 42161, 100, 10, 8453, 43114, 324, 59144] as const;
  type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number];

  // Network icon component
  const NetworkIcon = ({ chainId }: { chainId: number }) => {
    const chainInfo = CHAIN_INFO.find(chain => chain.id === chainId);
    const networkName = chainInfo?.name || CHAIN_NAMES[chainId.toString() as keyof typeof CHAIN_NAMES] || "Unknown";
    
    return (
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 relative overflow-hidden rounded-full bg-[#232853]">
          {chainInfo?.icon ? (
            <Image
              src={chainInfo.icon}
              width={20}
              height={20}
              alt={networkName}
              className="h-full w-full object-contain"
              unoptimized
            />
          ) : (
            <Globe className="h-full w-full text-[#c2c6ff]" />
          )}
        </div>
        <span className="ml-2">{networkName}</span>
      </div>
    );
  };

  // Network icon only (without text) - for use in the selector
  const NetworkIconOnly = ({ chainId }: { chainId: number }) => {
    const chainInfo = CHAIN_INFO.find(chain => chain.id === chainId);
    const networkName = chainInfo?.name || CHAIN_NAMES[chainId.toString() as keyof typeof CHAIN_NAMES] || "Unknown";
    
    return (
      <div className="h-8 w-8 relative overflow-hidden rounded-full flex items-center justify-center">
        {chainInfo?.icon ? (
          <Image
            src={chainInfo.icon}
            width={32}
            height={32}
            alt={networkName}
            className="h-full w-full object-contain"
            unoptimized
          />
        ) : (
          <Globe className="h-5 w-5 text-[#c2c6ff]" />
        )}
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
                <NetworkIconOnly chainId={destinationChainId} />
                <span className="ml-2">{CHAIN_NAMES[destinationChainId.toString() as keyof typeof CHAIN_NAMES]}</span>
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
            
            {/* 当前选择的Token和Chain信息显示 */}
            <div className="bg-[#232853]/50 rounded-lg p-3 mb-4 border border-[#2a3156]">
              <h3 className="text-[#c2c6ff] text-sm font-medium mb-2">当前选择</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center">
                  <div className="bg-[#191d3e] rounded-full h-6 w-6 flex items-center justify-center mr-2 overflow-hidden">
                    {typeof destinationChainId === 'number' && (
                      <NetworkIconOnly chainId={destinationChainId} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[#8a8dbd]">网络</p>
                    <p className="text-sm text-white">
                      {typeof destinationChainId === 'number' && CHAIN_NAMES[destinationChainId.toString() as keyof typeof CHAIN_NAMES] || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-[#191d3e] rounded-full h-6 w-6 flex items-center justify-center mr-2 overflow-hidden">
                    {selectedToken?.logoURI ? (
                      <Image 
                        src={selectedToken.logoURI} 
                        width={16} 
                        height={16} 
                        alt={selectedToken.symbol || "Token"} 
                        className="h-4 w-4 object-contain"
                        unoptimized
                      />
                    ) : (
                      <DollarSign className="h-3 w-3 text-[#c2c6ff]" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[#8a8dbd]">代币</p>
                    <p className="text-sm text-white">{selectedToken?.symbol || "USDC"}</p>
                  </div>
                </div>
              </div>
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
                {isLoadingTokens ? (
                  <div className="py-10 flex flex-col items-center justify-center text-[#8a8dbd]">
                    <Loader className="h-10 w-10 animate-spin mb-2" />
                    <p>Loading tokens...</p>
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
                            <Image 
                              src={token.logoURI}
                              alt={token.symbol}
                              width={32}
                              height={32}
                              className="h-full w-full object-contain"
                              unoptimized
                            />
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
            <h3 className="font-medium text-lg mb-3 text-white">选择网络</h3>
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
                    <NetworkIconOnly chainId={chainId} />
                    <span className="ml-3">{CHAIN_NAMES[chainId.toString() as keyof typeof CHAIN_NAMES]}</span>
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
            <span className="text-[#8a8dbd]">Recipient:</span>
            <span className="font-medium">{formatAddress(recipientAddress)}</span>
          </div>
          <div className="flex justify-between items-center px-3 py-1">
            <span className="text-[#8a8dbd]">Amount:</span>
            <span className="font-medium">
              {isQuoteLoading ? (
                <div className="flex items-center">
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                `${amount || '0'} ${'USDC'}`
              )}
            </span>
          </div>
          <div className="flex justify-between items-center px-3 py-1">
            <span className="text-[#8a8dbd]">Network Fee:</span>
            <span className="font-medium">{fee} {selectedToken?.symbol || 'USDC'}</span>
          </div>
          <div className="flex justify-between items-center px-3 py-1">
            <span className="text-[#8a8dbd]">Est. received:</span>
            <span className="font-medium">{estimatedReceived} {selectedToken?.symbol === 'ETH' ? 'ETH' : (selectedToken?.symbol || 'USDC')}</span>
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
