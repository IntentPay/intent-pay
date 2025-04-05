'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, Info, Check, ChevronDown, ArrowDown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Web3Avatar } from '@/components/wallet/Web3Avatar';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

// 链和代币的映射关系
const CHAIN_TOKEN_MAPPING = {
  '1': ['ETH', 'USDC'], // Ethereum
  '137': ['MATIC', 'USDC'], // Polygon
  '43114': ['AVAX', 'USDC'], // Avalanche
  '42161': ['ETH', 'USDC'], // Arbitrum
  '8453': ['ETH', 'USDC'], // Base
};

// 支持的代幣列表
const SUPPORTED_TOKENS = {
  'USDC': { symbol: 'USDC', name: 'USD Coin', decimals: 6, logo: '/assets/tokens/usdc.svg' },
  'ETH': { symbol: 'ETH', name: 'Ethereum', decimals: 18, logo: '/assets/tokens/eth.svg' },
  'MATIC': { symbol: 'MATIC', name: 'Polygon', decimals: 18, logo: '/assets/tokens/matic.svg' },
  'AVAX': { symbol: 'AVAX', name: 'Avalanche', decimals: 18, logo: '/assets/tokens/avax.svg' },
};

// 支持的鏈列表
const SUPPORTED_CHAINS = [
  { id: '1', name: 'Ethereum', logo: '/assets/chains/ethereum.svg' },
  { id: '137', name: 'Polygon', logo: '/assets/chains/polygon.svg' },
  { id: '43114', name: 'Avalanche', logo: '/assets/chains/avalanche.svg' },
  { id: '42161', name: 'Arbitrum', logo: '/assets/chains/arbitrum.svg' },
  { id: '8453', name: 'Base', logo: '/assets/chains/base.svg' },
];

// 默認滑點
const DEFAULT_SLIPPAGE = 0.5;

// 截斷地址顯示
const truncateAddress = (address: string, start = 6, end = 4) => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

// 包裝 useSearchParams 的組件
function IntentPayContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // 從 URL 獲取地址參數
  const addressParam = searchParams.get('address');
  
  // 狀態管理
  const [recipientAddress, setRecipientAddress] = useState(addressParam || '');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [selectedChainId, setSelectedChainId] = useState('1'); // 默認選擇 Ethereum
  const [toToken, setToToken] = useState<any>(null);
  const [estimatedReceived, setEstimatedReceived] = useState('0');
  const [fee, setFee] = useState('0');
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // 獲取當前選擇的鏈
  const selectedChain = SUPPORTED_CHAINS.find(chain => chain.id === selectedChainId);
  
  // 獲取當前鏈支持的代幣
  const availableTokens = selectedChainId 
    ? CHAIN_TOKEN_MAPPING[selectedChainId as keyof typeof CHAIN_TOKEN_MAPPING].map(symbol => SUPPORTED_TOKENS[symbol as keyof typeof SUPPORTED_TOKENS])
    : [];
  
  // 初始化選擇第一個可用代幣
  useEffect(() => {
    if (availableTokens.length > 0 && !toToken) {
      setToToken(availableTokens[0]);
    }
  }, [availableTokens, toToken]);
  
  // 根據金額計算預估收到的金額和費用
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount)) && toToken) {
      // 簡單模擬 - 實際上需要調用 API 獲取真實費率
      const amountNum = parseFloat(amount);
      const fee = amountNum * 0.003; // 假設 0.3% 的費用
      setFee(fee.toFixed(toToken.decimals === 6 ? 2 : 4));
      setEstimatedReceived((amountNum - fee).toFixed(toToken.decimals === 6 ? 2 : 4));
    } else {
      setFee('0');
      setEstimatedReceived('0');
    }
  }, [amount, toToken]);
  
  // 處理滑點變更
  const handleSlippageChange = (value: number) => {
    setSlippage(value);
    setShowSlippageSettings(false);
  };
  
  // 處理支付
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientAddress) {
      toast({
        title: "錯誤",
        description: "請輸入接收人地址",
        variant: "destructive",
      });
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: "錯誤",
        description: "請輸入有效金額",
        variant: "destructive",
      });
      return;
    }
    
    // 這裡會是實際支付流程 - 現在只是模擬成功
    setTimeout(() => {
      setPaymentSuccess(true);
    }, 1500);
    
    toast({
      title: "交易處理中",
      description: "正在處理您的交易請求...",
    });
  };
  
  // 選擇鏈
  const handleChainSelect = (chainId: string) => {
    setSelectedChainId(chainId);
    setShowChainSelector(false);
    // 重置代幣選擇
    setToToken(null);
  };
  
  // 選擇代幣
  const handleTokenSelect = (token: any) => {
    setToToken(token);
    setShowTokenSelector(false);
  };
  
  if (paymentSuccess) {
    return (
      <div className="container max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-green-100 rounded-full p-4 mb-6">
          <Check className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">支付成功!</h1>
        <p className="text-muted-foreground mb-6 text-center">
          您已成功向 {truncateAddress(recipientAddress)} 支付了 {amount} {toToken?.symbol}
        </p>
        <div className="flex gap-4 w-full">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首頁
            </Link>
          </Button>
          <Button className="flex-1">
            <Send className="mr-2 h-4 w-4" />
            新轉賬
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-bold">付款</h1>
        <div className="w-6"></div>
      </div>
      
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">接收方</div>
          {recipientAddress && (
            <div className="flex items-center gap-2">
              <Web3Avatar address={recipientAddress} size={24} />
              <span className="font-medium">{truncateAddress(recipientAddress)}</span>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* 先選擇鏈 */}
          <div className="mb-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowChainSelector(!showChainSelector)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
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
                  <span>{selectedChain?.name || '選擇鏈'}</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showChainSelector && (
                <div className="absolute left-0 right-0 mt-2 p-2 bg-background border border-border rounded-lg shadow-lg z-10">
                  <div className="text-sm text-muted-foreground px-2 py-1 border-b border-border mb-2">選擇鏈</div>
                  {SUPPORTED_CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      type="button"
                      onClick={() => handleChainSelect(chain.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md ${
                        selectedChainId === chain.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                      }`}
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
          
          {/* 選擇代幣和輸入金額 */}
          <div className="relative mb-4">
            <div className="flex flex-col bg-accent rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-muted-foreground">你支付</div>
                {/* 這裡可以添加餘額顯示 */}
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent border-none text-2xl font-medium outline-none w-[70%]"
                />
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
                    />
                  )}
                  <span>{toToken?.symbol || '選擇'}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {showTokenSelector && (
              <div className="absolute left-0 right-0 mt-2 p-2 bg-background border border-border rounded-lg shadow-lg z-10">
                <div className="text-sm text-muted-foreground px-2 py-1 border-b border-border mb-2">選擇代幣</div>
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
                    />
                    <span>{token.name}</span>
                    <span className="text-muted-foreground ml-1">({token.symbol})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* 接收金額預估 */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-accent/50 p-1 rounded-full">
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex flex-col bg-accent rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-muted-foreground">接收人將收到約</div>
              <button
                type="button"
                onClick={() => setShowSlippageSettings(!showSlippageSettings)}
                className="flex items-center text-xs text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-3 w-3 mr-1" />
                滑點: {slippage}%
              </button>
            </div>
            <div className="text-2xl font-medium">
              {estimatedReceived} {toToken?.symbol}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              包含網絡費用約 {fee} {toToken?.symbol}
            </div>
          </div>
          
          {/* 滑點設置 */}
          {showSlippageSettings && (
            <div className="bg-background border border-border rounded-lg p-4 mb-4">
              <div className="text-sm mb-2">調整滑點容忍度</div>
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
          
          <Button type="submit" className="w-full" size="lg">
            確認支付
          </Button>
        </form>
      </div>
      
      <div className="p-4 bg-blue-50 text-blue-700 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium mb-1">跨鏈支付</p>
          <p>IntentPay 會自動處理跨鏈交換和傳送，您無需擔心技術細節。系統會優化路徑以獲得最佳匯率。</p>
        </div>
      </div>
    </div>
  );
}

// 主頁面組件
export default function IntentPayPage() {
  return (
    <Suspense fallback={<div className="container max-w-md mx-auto p-4 flex justify-center items-center h-[70vh]">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>}>
      <IntentPayContent />
    </Suspense>
  );
}
