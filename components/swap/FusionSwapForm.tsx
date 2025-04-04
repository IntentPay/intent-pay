'use client';

import { useState, useEffect } from 'react';
import { createOrder, getQuote, getCrossChainQuote } from '@/lib/1inch/fusion';
import { getMultiChainTokenList, getTokensByChain, searchTokens, TokenInfoDto } from '@/lib/1inch/token';
import { SUPPORTED_CHAINS, CHAIN_NAMES } from '@/lib/1inch/config';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { ArrowDown, Search, Loader2, RefreshCw } from 'lucide-react';

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
  const [showFromTokenSelector, setShowFromTokenSelector] = useState<boolean>(false);
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
  
  // Load token list when component mounts
  useEffect(() => {
    async function loadTokens() {
      setIsLoadingTokens(true);
      try {
        const tokenListData = await getMultiChainTokenList();
        const chainTokens = getTokensByChain(isCrossChain ? sourceChainId : destinationChainId, tokenListData);
        setTokenList(chainTokens);
        setFilteredTokens(chainTokens);
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
  }, [sourceChainId, destinationChainId, isCrossChain, toast]);
  
  // Filter tokens based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTokens(tokenList);
      return;
    }
    
    const results = searchTokens(searchQuery, isCrossChain ? sourceChainId : destinationChainId);
    setFilteredTokens(results.length > 0 ? results : tokenList);
  }, [searchQuery, tokenList, sourceChainId, destinationChainId, isCrossChain]);
  
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
  
  const handleSelectFromToken = (token: TokenInfoDto) => {
    setFromToken(token.address);
    setSelectedFromToken(token);
    setShowFromTokenSelector(false);
  };
  
  const handleSelectToToken = (token: TokenInfoDto) => {
    setToToken(token.address);
    setSelectedToToken(token);
    setShowToTokenSelector(false);
  };
  
  const handleSwitchTokens = () => {
    if (selectedFromToken && selectedToToken) {
      setSelectedFromToken(selectedToToken);
      setSelectedToToken(selectedFromToken);
      setFromToken(selectedToToken.address);
      setToToken(selectedFromToken.address);
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>Fusion+ Swap</span>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Gasless</span>
      </h2>
      
      <div className="space-y-4">
        {/* Chain selector */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Chain</label>
            <select 
              className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          
          <div className="pt-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                value="" 
                className="sr-only peer" 
                checked={isCrossChain}
                onChange={() => {
                  setIsCrossChain(!isCrossChain);
                  setQuoteData(null);
                  setCrossChainQuoteData(null);
                }}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-xs font-medium text-gray-600">Cross-Chain</span>
            </label>
          </div>
          
          {isCrossChain && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination Chain</label>
              <select 
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            </div>
          )}
        </div>
        
        {/* From Token Selector */}
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">You Pay</label>
            {selectedFromToken && (
              <div className="text-sm text-gray-500">
                Balance: --
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              className="w-full p-2 bg-transparent text-xl font-medium focus:outline-none"
              placeholder="0.0" 
              value={amount}
              type="number"
              min="0"
              step="0.01"
              onChange={(e) => setAmount(e.target.value)}
            />
            
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 h-10 px-3 rounded-lg bg-white"
              onClick={() => setShowFromTokenSelector(!showFromTokenSelector)}
            >
              {selectedFromToken ? (
                <>
                  {selectedFromToken.logoURI && (
                    <img 
                      src={selectedFromToken.logoURI} 
                      alt={selectedFromToken.symbol} 
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span>{selectedFromToken.symbol}</span>
                </>
              ) : (
                <span>Select Token</span>
              )}
            </Button>
          </div>
        </div>
        
        {/* Swap Direction Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full w-10 h-10 p-0 border bg-white shadow-md"
            onClick={handleSwitchTokens}
            disabled={!selectedFromToken || !selectedToToken}
          >
            <ArrowDown size={16} />
          </Button>
        </div>
        
        {/* To Token Selector */}
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">You Receive</label>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-full p-2 text-xl font-medium text-gray-500">
              {quoteData?.toTokenAmount ? (
                parseFloat(quoteData.toTokenAmount) / Math.pow(10, quoteData.toToken?.decimals || 18)
              ) : crossChainQuoteData?.receiveAmount ? (
                parseFloat(crossChainQuoteData.receiveAmount) / Math.pow(10, crossChainQuoteData.receiveToken?.decimals || 18)
              ) : '0.0'}
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 h-10 px-3 rounded-lg bg-white"
              onClick={() => setShowToTokenSelector(!showToTokenSelector)}
            >
              {selectedToToken ? (
                <>
                  {selectedToToken.logoURI && (
                    <img 
                      src={selectedToToken.logoURI} 
                      alt={selectedToToken.symbol} 
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span>{selectedToToken.symbol}</span>
                </>
              ) : (
                <span>Select Token</span>
              )}
            </Button>
          </div>
        </div>
        
        {/* Display quote information */}
        {(quoteData || crossChainQuoteData) && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Exchange Rate:</p>
            
            {quoteData && (
              <div className="mt-1 text-lg font-semibold">
                1 {selectedFromToken?.symbol} ≈ {parseFloat(quoteData.toTokenAmount) / parseFloat(quoteData.fromTokenAmount)} {selectedToToken?.symbol}
              </div>
            )}
            
            {crossChainQuoteData && (
              <div className="space-y-2">
                <div className="mt-1 text-lg font-semibold">
                  1 {selectedFromToken?.symbol} ≈ {crossChainQuoteData.receiveAmount ? (parseFloat(crossChainQuoteData.receiveAmount) / parseFloat(amount)).toFixed(6) : '0'} {selectedToToken?.symbol}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">You will receive:</span>
                  <span className="font-medium">{crossChainQuoteData.receiveAmount ? (parseFloat(crossChainQuoteData.receiveAmount) / 10**18).toFixed(6) : '0'} {selectedToToken?.symbol}</span>
                </div>
                {crossChainQuoteData.fee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fee:</span>
                    <span className="font-medium">{(parseFloat(crossChainQuoteData.fee) / 100).toFixed(2)}%</span>
                  </div>
                )}
                {crossChainQuoteData.gasFee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Gas Fee:</span>
                    <span className="font-medium">{crossChainQuoteData.gasFee} {CHAIN_NAMES[sourceChainId.toString() as keyof typeof CHAIN_NAMES] || 'ETH'}</span>
                  </div>
                )}
                {isCrossChain && (
                  <div className="pt-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Custom Fee (bps, 100 = 1%)</label>
                    <input
                      type="number"
                      className="w-full rounded-md border border-gray-300 py-1 px-2 text-sm"
                      placeholder="0"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Action Button */}
        <Button 
          onClick={handleSwap} 
          disabled={isLoading || !fromToken || !toToken || !amount || !walletAddress}
          className="w-full py-3 h-12"
          variant="default"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Order...
            </span>
          ) : !walletAddress ? (
            'Verify with World ID first'
          ) : !fromToken || !toToken ? (
            'Select Tokens'
          ) : !amount ? (
            'Enter Amount'
          ) : (
            'Create Swap Order'
          )}
        </Button>
        
        {/* Order Result */}
        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg">
            <h3 className="font-medium text-green-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Order Created Successfully
            </h3>
            <div className="mt-2 space-y-1 text-sm">
              <div><strong>Order ID:</strong> <span className="font-mono">{result.id}</span></div>
              <div><strong>Status:</strong> {result.status}</div>
              <div><strong>Created:</strong> {new Date().toLocaleString()}</div>
            </div>
            <div className="mt-3 text-xs text-green-700">
              Your order has been submitted and is being processed. You can check its status in the "Order Status" tab.
            </div>
          </div>
        )}
      </div>
      
      {/* Token Selection Modal - From */}
      {showFromTokenSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Select Token</h3>
              <button 
                onClick={() => setShowFromTokenSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                placeholder="Search by name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="overflow-y-auto flex-grow">
              {isLoadingTokens ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tokens found
                </div>
              ) : (
                <div className="grid gap-1">
                  {filteredTokens.map((token) => (
                    <button
                      key={`from-${token.address}`}
                      className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg text-left"
                      onClick={() => handleSelectFromToken(token)}
                    >
                      {token.logoURI ? (
                        <img 
                          src={token.logoURI} 
                          alt={token.symbol} 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium">{token.symbol.substring(0, 2)}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-gray-500">{token.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Token Selection Modal - To */}
      {showToTokenSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Select Token</h3>
              <button 
                onClick={() => setShowToTokenSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                placeholder="Search by name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="overflow-y-auto flex-grow">
              {isLoadingTokens ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tokens found
                </div>
              ) : (
                <div className="grid gap-1">
                  {filteredTokens.map((token) => (
                    <button
                      key={`to-${token.address}`}
                      className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg text-left"
                      onClick={() => handleSelectToToken(token)}
                    >
                      {token.logoURI ? (
                        <img 
                          src={token.logoURI} 
                          alt={token.symbol} 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium">{token.symbol.substring(0, 2)}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-gray-500">{token.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
