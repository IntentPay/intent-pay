'use client';

import { useState, useEffect } from 'react';
import { createOrder, getQuote, getCrossChainQuote } from '@/lib/1inch/fusion';
import { getMultiChainTokenList, getTokensByChain, searchTokensApi, TokenInfoDto, getUsdcTokenInfo } from '@/lib/1inch/token';
import { SUPPORTED_CHAINS, CHAIN_NAMES } from '@/lib/1inch/config';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { ArrowDown, Search, Loader2, RefreshCw, X, Check, Settings } from 'lucide-react';

export function FusionSwapForm() {
  const { toast } = useToast();
  const [fromToken, setFromToken] = useState<string>('');
  const [toToken, setToToken] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [sourceChainId, setSourceChainId] = useState<number>(1); // Default to Ethereum
  const [destinationChainId, setDestinationChainId] = useState<number>(1); // Default to Ethereum
  const [isCrossChain, setIsCrossChain] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [crossChainQuoteData, setCrossChainQuoteData] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [fee, setFee] = useState<string>('0');
  
  // Token selection states
  const [tokenList, setTokenList] = useState<TokenInfoDto[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<TokenInfoDto[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showToTokenSelector, setShowToTokenSelector] = useState<boolean>(false);
  const [selectedFromToken, setSelectedFromToken] = useState<TokenInfoDto | null>(null);
  const [selectedToToken, setSelectedToToken] = useState<TokenInfoDto | null>(null);
  
  // Get user wallet address from World ID verification
  const getUserAddress = () => {
    const worldIdUser = localStorage.getItem('worldid_user');
    if (worldIdUser) {
      try {
        const userData = JSON.parse(worldIdUser);
        return userData.address;
      } catch (e) {
        console.error('Error parsing user data', e);
        return '';
      }
    }
    return '';
  };
  
  const walletAddress = getUserAddress();
  
  // Load USDC token as the default from token when source chain changes
  useEffect(() => {
    async function loadUsdcToken() {
      try {
        const usdcToken = await getUsdcTokenInfo(sourceChainId);
        if (usdcToken) {
          setFromToken(usdcToken.address);
          setSelectedFromToken(usdcToken);
        } else {
          // If USDC not found for this chain, clear the selection
          setFromToken('');
          setSelectedFromToken(null);
          console.warn(`USDC not found for chain ID ${sourceChainId}`);
        }
      } catch (error) {
        console.error('Error loading USDC token:', error);
      }
    }
    
    loadUsdcToken();
  }, [sourceChainId]);
  
  // Load token list when component mounts or chain changes
  useEffect(() => {
    async function loadTokens() {
      setIsLoadingTokens(true);
      try {
        // Always load tokens for the destination chain
        const chainIdToUse = isCrossChain ? destinationChainId : sourceChainId;
        
        if (searchQuery.trim()) {
          // Use the search API to get tokens
          const searchResults = await searchTokensApi(searchQuery, chainIdToUse, 20);
          setFilteredTokens(searchResults);
        } else {
          // Use the cached token list
          const tokenListData = await getMultiChainTokenList();
          const chainTokens = getTokensByChain(chainIdToUse, tokenListData);
          setTokenList(chainTokens);
          setFilteredTokens(chainTokens);
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
        toast({
          title: "Failed to load tokens",
          description: "Please try again later",
          variant: "destructive"
        });
      } finally {
        setIsLoadingTokens(false);
      }
    }
    
    loadTokens();
  }, [sourceChainId, destinationChainId, isCrossChain, searchQuery, toast]);
  
  // Get quote when inputs change
  useEffect(() => {
    if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) {
      setQuoteData(null);
      setCrossChainQuoteData(null);
      return;
    }
    
    const getSwapQuote = async () => {
      try {
        if (isCrossChain) {
          // Get cross-chain quote
          const crossChainQuote = await getCrossChainQuote(
            sourceChainId,
            destinationChainId,
            fromToken,
            toToken,
            amount,
            walletAddress,
            {
              enableEstimate: true,
              fee: parseInt(fee)
            }
          );
          setCrossChainQuoteData(crossChainQuote);
          setQuoteData(null);
        } else {
          // Get regular quote
          const quote = await getQuote(sourceChainId, fromToken, toToken, amount);
          setQuoteData(quote);
          setCrossChainQuoteData(null);
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        setQuoteData(null);
        setCrossChainQuoteData(null);
      }
    };
    
    // Debounce the quote fetching
    const timeoutId = setTimeout(getSwapQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [fromToken, toToken, amount, sourceChainId, destinationChainId, isCrossChain, walletAddress, fee]);
  
  const handleSwap = async () => {
    if (!fromToken || !toToken || !amount || !walletAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      if (isCrossChain) {
        // Create cross-chain order functionality would be implemented here
        // when 1inch provides the API for it
        toast({
          title: "Cross-Chain Functionality",
          description: "Cross-chain orders creation is not yet available in the API",
          variant: "default"
        });
      } else {
        const order = await createOrder({
          chainId: sourceChainId,
          fromTokenAddress: fromToken,
          toTokenAddress: toToken,
          amount,
          walletAddress,
          slippage: '1', // 1% slippage
        });
        
        setResult(order);
        
        // Store order ID for later reference
        localStorage.setItem('lastFusionOrderId', order.id);
        localStorage.setItem('lastFusionChainId', sourceChainId.toString());
        
        toast({
          title: "Order Created",
          description: "Your swap order has been submitted successfully",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error('Fusion order creation failed:', error);
      toast({
        title: "Order Failed",
        description: error.response?.data?.message || "Failed to create order",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectToToken = (token: TokenInfoDto) => {
    setToToken(token.address);
    setSelectedToToken(token);
    setShowToTokenSelector(false);
  };
  
  return (
    <div className="w-full max-w-md mx-auto bg-gray-900 shadow-lg rounded-2xl p-6 text-white">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-4">
            <button className="px-4 py-2 text-white font-medium rounded-lg bg-blue-600" title="Swap tokens">Swap</button>
            <button className="px-4 py-2 text-gray-400 font-medium rounded-lg hover:bg-gray-800" title="Create limit order">Limit</button>
          </div>
          <div className="flex space-x-2">
            <button 
              className="p-2 rounded-full hover:bg-gray-800"
              onClick={() => {
                setQuoteData(null);
                setCrossChainQuoteData(null);
                // Trigger a re-fetch by slightly modifying the amount
                if (amount) {
                  const newAmount = parseFloat(amount) + 0.000001;
                  setAmount(newAmount.toString());
                }
              }}
              title="Refresh quote"
            >
              <RefreshCw className="h-5 w-5 text-gray-400" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-800" title="Settings">
              <Settings className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center mb-4">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={isCrossChain}
                onChange={(e) => {
                  setIsCrossChain(e.target.checked);
                  // Reset selections when toggling
                  if (!e.target.checked) {
                    setDestinationChainId(sourceChainId);
                  }
                  setToToken('');
                  setSelectedToToken(null);
                  setQuoteData(null);
                  setCrossChainQuoteData(null);
                }}
              />
              <div className={`w-10 h-6 ${isCrossChain ? 'bg-blue-600' : 'bg-gray-700'} rounded-full shadow-inner`}></div>
              <div className={`absolute w-4 h-4 bg-white rounded-full shadow transition ${isCrossChain ? 'transform translate-x-5' : 'translate-x-1'} top-1`}></div>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-300">Cross-Chain Swap</span>
          </label>
        </div>
        
        {/* Chain Selectors */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-400">Source Chain</label>
            <select 
              className="w-full rounded-xl border border-gray-700 bg-gray-800 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
              value={sourceChainId}
              onChange={(e) => {
                setSourceChainId(Number(e.target.value));
                setFromToken('');
                setSelectedFromToken(null);
                setQuoteData(null);
                setCrossChainQuoteData(null);
              }}
              aria-label="Select source blockchain network"
            >
              {Object.entries(CHAIN_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-400">Destination Chain</label>
            <div className="relative">
              <select 
                className="w-full rounded-xl border border-gray-700 bg-gray-800 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                value={destinationChainId}
                onChange={(e) => {
                  setDestinationChainId(Number(e.target.value));
                  setToToken('');
                  setSelectedToToken(null);
                  setQuoteData(null);
                  setCrossChainQuoteData(null);
                }}
                disabled={!isCrossChain}
                aria-label="Select destination blockchain network"
              >
                {Object.entries(CHAIN_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              {!isCrossChain && (
                <div className="absolute inset-0 bg-gray-800 opacity-50 cursor-not-allowed rounded-xl"></div>
              )}
            </div>
          </div>
        </div>
        
        {/* Fee setting (only for cross-chain) */}
        {isCrossChain && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-400">Fee (basis points - 1 bp = 0.01%)</label>
            <input
              type="number"
              min="0"
              max="1000"
              className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0"
            />
            <div className="text-xs text-gray-400 mt-1">
              Current fee: {parseInt(fee) / 100}%
            </div>
          </div>
        )}
      </div>
      
      {/* From Token Selection - Now read-only since from token is always USDC */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-400">You Pay</label>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1">
              <input
                type="text"
                className="w-full bg-transparent text-2xl font-semibold focus:outline-none"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numeric input with decimal point
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setAmount(value);
                  }
                }}
                placeholder="0.0"
              />
            </div>
            
            <div 
              className="flex items-center px-3 py-2 bg-gray-700 rounded-xl cursor-not-allowed"
            >
              {selectedFromToken ? (
                <div className="flex items-center">
                  {selectedFromToken.logoURI && (
                    <img 
                      src={selectedFromToken.logoURI} 
                      alt={selectedFromToken.symbol} 
                      className="w-6 h-6 mr-2 rounded-full"
                    />
                  )}
                  <span className="font-medium">{selectedFromToken.symbol}</span>
                </div>
              ) : (
                <span className="text-gray-400">Loading USDC...</span>
              )}
            </div>
          </div>
          
          {selectedFromToken && (
            <div className="text-sm text-gray-400">
              on {CHAIN_NAMES[sourceChainId.toString() as keyof typeof CHAIN_NAMES] || 'Unknown Chain'}
            </div>
          )}
        </div>
      </div>
      
      {/* Swap Direction Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          className="rounded-full w-10 h-10 p-0 bg-gray-800 border border-gray-700 shadow-md flex items-center justify-center"
          disabled={true}
          title="Switch tokens (disabled)"
        >
          <ArrowDown size={16} className="text-gray-400" />
        </button>
      </div>
      
      {/* To Token Selection */}
      <div className="mb-6 mt-2">
        <label className="block text-sm font-medium mb-2 text-gray-400">You Receive</label>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-2xl font-semibold text-gray-300">
              {quoteData && selectedToToken
                ? (parseFloat(quoteData.toTokenAmount) / 10 ** selectedToToken.decimals).toFixed(6)
                : crossChainQuoteData 
                  ? crossChainQuoteData.estimatedAmount
                  : '0'
              }
            </div>
            
            <div 
              className="flex items-center px-3 py-2 bg-gray-700 rounded-xl cursor-pointer"
              onClick={() => setShowToTokenSelector(true)}
            >
              {selectedToToken ? (
                <div className="flex items-center">
                  {selectedToToken.logoURI && (
                    <img 
                      src={selectedToToken.logoURI} 
                      alt={selectedToToken.symbol} 
                      className="w-6 h-6 mr-2 rounded-full"
                    />
                  )}
                  <span className="font-medium">{selectedToToken.symbol}</span>
                </div>
              ) : (
                <span className="text-gray-400">Select a token</span>
              )}
            </div>
          </div>
          
          {selectedToToken && (
            <div className="text-sm text-gray-400">
              on {CHAIN_NAMES[(isCrossChain ? destinationChainId : sourceChainId).toString() as keyof typeof CHAIN_NAMES] || 'Unknown Chain'}
            </div>
          )}
        </div>
        
        {/* To Token Selector Modal */}
        {showToTokenSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-bold">Select Token</h3>
                <button 
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowToTokenSelector(false)}
                  title="Close token selector"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                    placeholder="Search by name or symbol"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Common tokens */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {['USDC', 'ETH', 'WETH', 'DAI', 'USDT', 'WBTC'].map(symbol => (
                    <button
                      key={symbol}
                      className="flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full p-2"
                      onClick={() => {
                        setSearchQuery(symbol);
                      }}
                    >
                      <span className="text-sm font-medium px-2">{symbol}</span>
                    </button>
                  ))}
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  {isLoadingTokens ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : filteredTokens.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      No tokens found
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredTokens.map((token) => (
                        <div
                          key={token.address}
                          className="flex items-center p-3 hover:bg-gray-800 rounded-xl cursor-pointer"
                          onClick={() => handleSelectToToken(token)}
                        >
                          {token.logoURI ? (
                            <img
                              src={token.logoURI}
                              alt={token.symbol}
                              className="w-8 h-8 mr-3 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                              <span className="text-xs">{token.symbol.substring(0, 2)}</span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-xs text-gray-400">{token.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Quote Information */}
      {(quoteData || crossChainQuoteData) && (
        <div className="mb-6 p-3 bg-gray-800 rounded-xl text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">Exchange Rate:</span>
            <span className="font-medium">
              {quoteData && selectedFromToken && selectedToToken
                ? `1 ${selectedFromToken.symbol} ≈ ${
                    (parseFloat(quoteData.toTokenAmount) / 
                    (parseFloat(quoteData.fromTokenAmount) / 10 ** selectedFromToken.decimals) / 
                    10 ** selectedToToken.decimals).toFixed(6)
                  } ${selectedToToken.symbol}`
                : crossChainQuoteData 
                  ? `1 ${selectedFromToken?.symbol || ''} ≈ ${crossChainQuoteData.rate || '-'} ${selectedToToken?.symbol || ''}`
                  : '-'
              }
            </span>
          </div>
          
          {crossChainQuoteData && (
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Fee:</span>
              <span className="font-medium">{crossChainQuoteData.fee ? `${parseFloat(crossChainQuoteData.fee) / 100}%` : '-'}</span>
            </div>
          )}
        </div>
      )}
  
      {/* Swap Button */}
      <button
        className={`w-full py-3 px-4 rounded-xl text-white font-medium text-lg ${
          isLoading || !selectedFromToken || !selectedToToken || !amount || parseFloat(amount) <= 0
            ? 'bg-blue-800 opacity-50 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        disabled={isLoading || !selectedFromToken || !selectedToToken || !amount || parseFloat(amount) <= 0}
        onClick={handleSwap}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Processing...
          </div>
        ) : !selectedFromToken ? (
          'Select source token'
        ) : !selectedToToken ? (
          'Select destination token'
        ) : !amount || parseFloat(amount) <= 0 ? (
          'Enter an amount'
        ) : (
          'Swap'
        )}
      </button>
      
      {/* Result */}
      {result && (
        <div className="mt-4 p-4 bg-green-900 bg-opacity-20 border border-green-700 rounded-xl">
          <h3 className="font-medium text-green-400 mb-1 flex items-center">
            <Check className="h-4 w-4 mr-1" /> Order Created!
          </h3>
          <p className="text-xs text-green-300 break-all">Order ID: {result.id}</p>
        </div>
      )}
    </div>
  );
}
