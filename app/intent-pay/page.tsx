'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, Info, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Web3Avatar } from '@/components/wallet/Web3Avatar';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

// 支持的代幣列表
const SUPPORTED_TOKENS = [
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, logo: '/assets/usdc.png' },
  { symbol: 'ETH', name: 'Ethereum', decimals: 18, logo: '/assets/eth.png' },
  { symbol: 'MATIC', name: 'Polygon', decimals: 18, logo: '/assets/matic.png' },
  { symbol: 'AVAX', name: 'Avalanche', decimals: 18, logo: '/assets/avax.png' },
];

// 支持的鏈列表
const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', logo: '/assets/eth.png' },
  { id: 137, name: 'Polygon', logo: '/assets/matic.png' },
  { id: 43114, name: 'Avalanche', logo: '/assets/avax.png' },
  { id: 42161, name: 'Arbitrum', logo: '/assets/arbitrum.png' },
  { id: 8453, name: 'Base', logo: '/assets/base.png' },
];

// 默認滑點
const DEFAULT_SLIPPAGE = 0.5;

export default function IntentPayPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // 從 URL 獲取地址參數
  const addressParam = searchParams.get('address');
  
  // 狀態管理
  const [recipientAddress, setRecipientAddress] = useState(addressParam || '');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [toToken, setToToken] = useState(SUPPORTED_TOKENS[0]);
  const [toChain, setToChain] = useState(SUPPORTED_CHAINS[0]);
  const [estimatedReceived, setEstimatedReceived] = useState('0');
  const [fee, setFee] = useState('0');
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // 截斷地址顯示
  const truncateAddress = (address: string, start = 6, end = 4) => {
    if (!address) return '';
    return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
  };
  
  // 根據金額計算預估收到的金額和費用
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const inputAmount = parseFloat(amount);
      // 模擬計算預估收到的金額（減去 1% 的費用）
      const calculatedFee = inputAmount * 0.01;
      const received = inputAmount - calculatedFee;
      setFee(calculatedFee.toFixed(6));
      setEstimatedReceived(received.toFixed(6));
    } else {
      setFee('0');
      setEstimatedReceived('0');
    }
  }, [amount, toToken, toChain, slippage]);
  
  // 處理發送交易
  const handleSendTransaction = () => {
    // 這裡應該調用實際的交易處理邏輯
    toast({
      title: "交易已提交",
      description: "您的交易正在處理中...",
    });
    
    // 模擬交易成功
    setTimeout(() => {
      setPaymentSuccess(true);
    }, 2000);
  };
  
  // 顯示成功畫面
  if (paymentSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="bg-green-100 rounded-full p-6 mb-6">
          <Check className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">轉賬成功!</h1>
        <p className="text-gray-500 mb-6 text-center">
          您已成功向 {truncateAddress(recipientAddress)} 轉賬 {amount} USDC
        </p>
        <Link href="/">
          <Button className="w-full">返回首頁</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col w-full max-w-md mx-auto gap-4 p-4">
      {/* 頂部導航 */}
      <div className="flex items-center mb-4">
        <Link href="/" className="mr-4">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-semibold">轉賬 USDC</h1>
      </div>
      
      {/* 收款人信息 */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Web3Avatar address={recipientAddress} size="lg" />
          <div>
            <h2 className="font-medium">收款人</h2>
            <p className="text-gray-600 text-sm">{truncateAddress(recipientAddress)}</p>
          </div>
        </div>
      </div>
      
      {/* 金額輸入 */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
        <label className="block text-sm text-gray-600 mb-2" htmlFor="amount-input">輸入金額 (USDC)</label>
        <div className="relative">
          <input
            type="number"
            id="amount-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full text-3xl font-semibold focus:outline-none"
            aria-label="USDC 金額"
          />
          <div className="absolute right-0 top-0 flex items-center h-full">
            <img src="/assets/usdc.png" alt="USDC" className="h-6 w-6 mr-2" />
            <span className="font-medium">USDC</span>
          </div>
        </div>
      </div>
      
      {/* 目標代幣和鏈選擇 */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm text-gray-600" htmlFor="token-select">收款代幣</label>
          <div className="relative inline-block">
            <select 
              id="token-select"
              value={toToken.symbol}
              onChange={(e) => {
                const selected = SUPPORTED_TOKENS.find(t => t.symbol === e.target.value);
                if (selected) setToToken(selected);
              }}
              className="appearance-none bg-gray-100 px-3 py-1 pr-8 rounded-lg focus:outline-none"
              aria-label="選擇代幣"
            >
              {SUPPORTED_TOKENS.map(token => (
                <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm text-gray-600" htmlFor="chain-select">目標鏈</label>
          <div className="relative inline-block">
            <select 
              id="chain-select"
              value={toChain.id}
              onChange={(e) => {
                const selected = SUPPORTED_CHAINS.find(c => c.id === parseInt(e.target.value));
                if (selected) setToChain(selected);
              }}
              className="appearance-none bg-gray-100 px-3 py-1 pr-8 rounded-lg focus:outline-none"
              aria-label="選擇區塊鏈"
            >
              {SUPPORTED_CHAINS.map(chain => (
                <option key={chain.id} value={chain.id}>{chain.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* 滑點設置 */}
        <div className="mb-2">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowSlippageSettings(!showSlippageSettings)}>
            <span className="text-sm text-gray-600">滑點容許度</span>
            <div className="flex items-center">
              <span className="text-sm">{slippage}%</span>
              <Info className="h-4 w-4 ml-1 text-gray-400" />
            </div>
          </div>
          
          {showSlippageSettings && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex gap-2 mb-2">
                {[0.1, 0.5, 1.0].map(value => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      slippage === value ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-600'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
              <div className="flex items-center">
                <label className="sr-only" htmlFor="custom-slippage">自訂滑點百分比</label>
                <input
                  id="custom-slippage"
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                  step="0.1"
                  min="0.1"
                  max="5"
                  className="w-16 px-2 py-1 mr-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  aria-label="自訂滑點百分比"
                />
                <span className="text-sm text-gray-600">自訂百分比</span>
              </div>
            </div>
          )}
        </div>
        
        {/* 預估收到的金額和費用 */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">預估收到</span>
            <span className="text-sm font-medium">{estimatedReceived} {toToken.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">費用</span>
            <span className="text-sm font-medium">{fee} USDC</span>
          </div>
        </div>
      </div>
      
      {/* 發送按鈕 */}
      <Button 
        className="w-full py-6 text-lg font-semibold"
        onClick={handleSendTransaction}
        disabled={!amount || parseFloat(amount) <= 0 || !recipientAddress}
      >
        <Send className="mr-2 h-5 w-5" />
        發送 USDC
      </Button>
    </div>
  );
}
