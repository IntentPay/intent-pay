'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, Info, Check, ChevronDown, ArrowDown, Settings, QrCode, CircleX, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Web3Avatar } from '@/components/wallet/Web3Avatar';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { QRScannerModal } from '@/components/qr/QRScanner';
import { MiniKit } from '@worldcoin/minikit-js';
import { getMultiChainTokenList, getTokensByChain, searchTokensApi, TokenInfoDto, getUsdcTokenInfo } from '@/lib/1inch/token';
import { SUPPORTED_CHAINS, CHAIN_NAMES } from '@/lib/1inch/config';
import Image from 'next/image';

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
  const [selectedChainId, setSelectedChainId] = useState('1'); // Default to Ethereum
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [estimatedReceived, setEstimatedReceived] = useState('0');
  const [fee, setFee] = useState('0');
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [sourceTokenInfo, setSourceTokenInfo] = useState<TokenInfoDto | null>(null);
  
  // Token states - similar to FusionSwapForm
  const [availableTokens, setAvailableTokens] = useState<TokenInfoDto[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<TokenInfoDto[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenInfoDto | null>(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get current chain name
  const chainName = selectedChainId ? CHAIN_NAMES[selectedChainId as keyof typeof CHAIN_NAMES] : '';
  
  // Load USDC token info using 1inch API
  useEffect(() => {
    async function loadUsdcTokenInfo() {
      try {
        const usdcInfo = await getUsdcTokenInfo(parseInt(selectedChainId));
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
    let isMounted = true; // 防止组件卸载后设置状态
    
    async function loadTokens() {
      if (!selectedChainId) return;
      
      setIsLoadingTokens(true);
      try {
        const chainId = parseInt(selectedChainId);
        
        if (searchQuery.trim()) {
          // Use search API
          const results = await searchTokensApi(searchQuery, chainId, 20);
          if (isMounted) {
            setFilteredTokens(Array.isArray(results) ? results : []);
          }
        } else {
          // 获取所有代币
          try {
            const tokenListData = await getMultiChainTokenList();
            if (!tokenListData || !tokenListData.tokens) {
              throw new Error('Invalid token data');
            }
            
            const chainTokens = getTokensByChain(chainId, tokenListData);
            const tokenArray = Array.isArray(chainTokens) ? chainTokens : [];
            
            if (isMounted) {
              // 一次性更新状态，减少渲染次数
              setAvailableTokens(tokenArray);
              setFilteredTokens(tokenArray);
            }
          } catch (innerError) {
            console.error('Error processing token data:', innerError);
            if (isMounted) {
              setAvailableTokens([]);
              setFilteredTokens([]);
            }
            throw innerError; // 向上传递错误以触发toast
          }
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
        if (isMounted) {
          setAvailableTokens([]);
          setFilteredTokens([]);
          toast({
            title: "Failed to load tokens",
            description: "Please try again later",
            variant: "destructive"
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingTokens(false);
        }
      }
    }
    
    loadTokens();
    
    // 清理函数，防止内存泄漏
    return () => {
      isMounted = false;
    };
  }, [selectedChainId, searchQuery]); // 移除 toast 依赖
  
  // 单独处理默认token选择，与token加载分离
  useEffect(() => {
    if (!selectedChainId || !availableTokens.length) return;
    
    const chainId = parseInt(selectedChainId);
    
    // 只有在没有选择token或chain不匹配时才设置默认token
    if (!selectedToken || selectedToken.chainId !== chainId) {
      // 使用箭头函数而不是函数声明，避免严格模式下的错误
      const setDefaultToken = async () => {
        try {
          // 先尝试设置USDC作为默认token
          const usdcToken = await getUsdcTokenInfo(chainId);
          if (usdcToken) {
            setSelectedToken(usdcToken);
          } else if (availableTokens.length > 0) {
            // 如果没有USDC，使用第一个可用token
            setSelectedToken(availableTokens[0]);
          }
        } catch (error) {
          console.error('Error setting default token:', error);
          // 出错时使用第一个可用token
          if (availableTokens.length > 0) {
            setSelectedToken(availableTokens[0]);
          }
        }
      };
      
      setDefaultToken();
    }
  }, [selectedChainId, availableTokens]); // 移除 selectedToken 依赖
  
  // Calculate estimated receipt amount
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount)) && selectedToken) {
      const amountNum = parseFloat(amount);
      const fee = amountNum * 0.003; // 0.3% fee assumed
      setFee(fee.toFixed(selectedToken.decimals === 6 ? 2 : 4));
      setEstimatedReceived((amountNum - fee).toFixed(selectedToken.decimals === 6 ? 2 : 4));
    } else {
      setFee('0');
      setEstimatedReceived('0');
    }
  }, [amount, selectedToken]);
  
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
    
    if (!selectedToken) {
      toast({
        title: "Error",
        description: "Please select a token to receive",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate transaction processing
    toast({
      title: "Processing Transaction",
      description: "Your transaction request is being processed...",
    });
    
    setTimeout(() => {
      setPaymentSuccess(true);
    }, 1500);
  };
  
  // Select chain
  const handleChainSelect = (chainId: string) => {
    sendHapticHeavyCommand();
    setSelectedChainId(chainId);
    setShowChainSelector(false);
    setSearchQuery('');
  };
  
  // Select token
  const handleTokenSelect = (token: TokenInfoDto) => {
    setSelectedToken(token);
    setShowTokenSelector(false);
  };
  
  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
  
  return (
    <div className="container max-w-md mx-auto p-4">
      <div className="mb-6 flex items-center">
        <Link href="/" className="mr-4">
          <Button variant="ghost" size="icon" className="rounded-full" title="Back to home">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Pay with World App</h1>
      </div>
      
      <div className="w-full max-w-md mx-auto bg-gray-900 shadow-lg rounded-2xl p-6 text-white">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient Address */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="recipient" className="block text-sm font-medium text-gray-300">
                Recipient Address
              </label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => setShowQRScanner(true)}
                title="Scan QR code"
              >
                <QrCode size={14} className="mr-1" />
                Scan QR
              </Button>
            </div>
            <div className="flex relative">
              <input
                type="text"
                id="recipient"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value.replace(/^ethereum:/i, ''))}
                placeholder="0x... or ENS name"
                className="w-full p-3 border border-gray-700 bg-gray-800 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white text-sm font-mono pr-10"
              />
              {recipientAddress && (
                <button
                  type="button"
                  onClick={clearAddress}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  title="Clear address"
                >
                  <CircleX size={16} />
                </button>
              )}
            </div>
            {recipientAddress && (
              <div className="flex items-center gap-2 mt-1 px-2">
                <Web3Avatar address={recipientAddress} size={20} />
                <div className="text-xs text-gray-400 overflow-hidden overflow-ellipsis w-full">
                  {recipientAddress}
                </div>
              </div>
            )}
          </div>
          
          {/* Amount Field - USDC Fixed */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              You Pay
            </label>
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numeric input with decimal point
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setAmount(value);
                    }
                  }}
                  placeholder="0.0"
                  className="w-full bg-transparent text-2xl font-semibold focus:outline-none"
                />
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 cursor-default min-w-[90px] justify-center">
                  {sourceTokenInfo?.logoURI && (
                    <img 
                      src={sourceTokenInfo.logoURI} 
                      alt={sourceTokenInfo.symbol} 
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/tokens/default-token.svg';
                      }}
                    />
                  )}
                  <span className="font-medium">USDC</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Arrow Separator */}
          <div className="flex justify-center -my-2">
            <div className="bg-gray-800 p-2 rounded-full shadow-md border border-gray-700">
              <ArrowDown className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          
          {/* Receive Token Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-300">
                Recipient Gets (Estimated)
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setShowChainSelector(true)}
                  className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white bg-gray-800 px-2 py-1 rounded-lg"
                  title="Select destination chain"
                >
                  <span>{chainName}</span>
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div className="text-2xl font-semibold">
                  {estimatedReceived || '0.0'}
                </div>
                <button
                  type="button"
                  onClick={() => setShowTokenSelector(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 transition-colors"
                  title="Select token to receive"
                >
                  {selectedToken ? (
                    <>
                      {selectedToken.logoURI && (
                        <img 
                          src={selectedToken.logoURI} 
                          alt={selectedToken.symbol} 
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/tokens/default-token.svg';
                          }}
                        />
                      )}
                      <span className="font-medium">{selectedToken.symbol}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Select token</span>
                  )}
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Transaction Summary */}
          <div className="bg-gray-800 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Estimated Received</span>
              <span className="font-medium">
                {estimatedReceived} {selectedToken?.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <span className="text-gray-400">Network Fee</span>
                <button 
                  type="button"
                  onClick={() => setShowSlippageSettings(true)}
                  className="ml-1 text-gray-400 hover:text-blue-400"
                  title="Adjust slippage settings"
                >
                  <Settings size={14} />
                </button>
              </div>
              <span className="font-medium">
                {fee} USDC ({(parseFloat(fee) / (parseFloat(amount) || 1) * 100).toFixed(2)}%)
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Slippage Tolerance</span>
              <span className="font-medium">{slippage}%</span>
            </div>
            
            <div className="pt-2 mt-2 border-t border-gray-700">
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <Info size={14} className="min-w-[14px] mt-0.5" />
                <p>Your payment will be processed through the World App wallet without requiring additional gas fees.</p>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
            disabled={!recipientAddress || !amount || !selectedToken || parseFloat(amount) <= 0}
          >
            <Send size={18} />
            Pay with World App
          </Button>
        </form>
      </div>
      
      {/* Chain Selector Modal */}
      {showChainSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 border border-gray-800 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Select Chain</h3>
              <button 
                type="button" 
                onClick={() => setShowChainSelector(false)}
                className="text-gray-400 hover:text-white"
                title="Close chain selector"
              >
                <CircleX size={20} />
              </button>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {Object.entries(CHAIN_NAMES).map(([id, name]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleChainSelect(id)}
                  className={`w-full p-3 flex items-center rounded-xl ${
                    selectedChainId === id ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Token Selector Modal */}
      {showTokenSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 border border-gray-800 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Select Token</h3>
              <button 
                type="button" 
                onClick={() => setShowTokenSelector(false)}
                className="text-gray-400 hover:text-white"
                title="Close token selector"
              >
                <CircleX size={20} />
              </button>
            </div>
            
            {/* Search input */}
            <div className="flex items-center border border-gray-700 rounded-xl p-2 mb-4 bg-gray-800">
              <Search size={18} className="text-gray-400 mx-2" />
              <input
                type="text"
                placeholder="Search by name or address"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-transparent focus:outline-none text-white"
              />
            </div>
            
            {/* Token list */}
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {isLoadingTokens ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 size={24} className="animate-spin text-blue-400" />
                </div>
              ) : filteredTokens.length > 0 ? (
                filteredTokens.map((token) => (
                  <button
                    key={token.address}
                    type="button"
                    onClick={() => handleTokenSelect(token)}
                    className={`w-full p-3 flex items-center justify-between rounded-xl ${
                      selectedToken?.address === token.address 
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                        : 'hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center">
                      {token.logoURI && (
                        <img 
                          src={token.logoURI} 
                          alt={token.symbol} 
                          className="w-8 h-8 mr-3 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/tokens/default-token.svg';
                          }}
                        />
                      )}
                      <div className="text-left">
                        <div className="font-medium text-white">{token.symbol}</div>
                        <div className="text-xs text-gray-400">{token.name}</div>
                      </div>
                    </div>
                    {selectedToken?.address === token.address && (
                      <Check size={18} className="text-blue-400" />
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No tokens found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Slippage Settings Modal */}
      {showSlippageSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 border border-gray-800 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Slippage Settings</h3>
              <button 
                type="button" 
                onClick={() => setShowSlippageSettings(false)}
                className="text-gray-400 hover:text-white"
                title="Close slippage settings"
              >
                <CircleX size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSlippageChange(0.1)}
                  className={`flex-1 p-3 rounded-xl border ${
                    slippage === 0.1 
                      ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' 
                      : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  0.1%
                </button>
                <button
                  type="button"
                  onClick={() => handleSlippageChange(0.5)}
                  className={`flex-1 p-3 rounded-xl border ${
                    slippage === 0.5 
                      ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' 
                      : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  0.5%
                </button>
                <button
                  type="button"
                  onClick={() => handleSlippageChange(1.0)}
                  className={`flex-1 p-3 rounded-xl border ${
                    slippage === 1.0 
                      ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' 
                      : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  1.0%
                </button>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                Your transaction will revert if the price changes by more than this percentage.
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* QR Scanner Modal */}
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
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      }>
        <IntentPayContent />
      </Suspense>
    </>
  );
}
