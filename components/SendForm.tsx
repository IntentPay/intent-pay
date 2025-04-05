'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidEthereumAddress } from '@/lib/utils';
import { getMultiChainTokenList, getTokensByChain, TokenInfoDto, getUsdcTokenInfo } from '@/lib/1inch/token';
import { SUPPORTED_CHAINS, CHAIN_NAMES } from '@/lib/1inch/config';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast/use-toast';

// Form validation schema
const sendFormSchema = z.object({
  recipient: z.string().refine(val => isValidEthereumAddress(val.replace(/^ethereum:/i, '')), {
    message: "Invalid Ethereum address",
  }),
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  chainId: z.string().optional(),
  toToken: z.string().optional(),
});

type SendFormValues = z.infer<typeof sendFormSchema>;

interface SendFormProps {
  onSend: (recipient: string, amount: string, chainId?: string, tokenAddress?: string) => Promise<void>;
  maxAmount?: string;
  onCancel?: () => void;
}

export function SendForm({ onSend, maxAmount = '0', onCancel }: SendFormProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<Partial<SendFormValues>>({
    recipient: '',
    amount: '',
    chainId: Object.values(SUPPORTED_CHAINS)[0].toString(), // Default to first supported chain
    toToken: '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof SendFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Chain and token selection
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [selectedChain, setSelectedChain] = useState<{id: string, name: string} | null>(null);
  const [availableTokens, setAvailableTokens] = useState<TokenInfoDto[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenInfoDto | null>(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTokens, setFilteredTokens] = useState<TokenInfoDto[]>([]);

  // Initialize default chain
  useEffect(() => {
    const chainId = values.chainId;
    if (chainId && CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES]) {
      setSelectedChain({
        id: chainId,
        name: CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES]
      });
    }
  }, []);

  // Load tokens when chain changes
  useEffect(() => {
    if (!values.chainId) return;
    
    async function loadTokens() {
      setIsLoadingTokens(true);
      try {
        const chainId = parseInt(values.chainId || '1');
        
        // Get the token list for the selected chain
        const tokenListData = await getMultiChainTokenList();
        const chainTokens = getTokensByChain(chainId, tokenListData);
        
        setAvailableTokens(chainTokens);
        setFilteredTokens(chainTokens);
        
        // Set default token (USDC)
        const usdcToken = await getUsdcTokenInfo(chainId);
        if (usdcToken) {
          handleTokenSelect(usdcToken);
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
        toast({
          title: "Failed to load tokens",
          description: "Please try again later",
        });
      } finally {
        setIsLoadingTokens(false);
      }
    }
    
    loadTokens();
  }, [values.chainId, toast]);

  // Filter tokens when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTokens(availableTokens);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = availableTokens.filter(token => 
      token.name.toLowerCase().includes(query) || 
      token.symbol.toLowerCase().includes(query) ||
      token.address.toLowerCase().includes(query)
    );
    
    setFilteredTokens(filtered);
  }, [searchQuery, availableTokens]);

  const handleChange = (field: keyof SendFormValues, value: string) => {
    if (field === 'recipient') {
      // 移除ethereum:前缀
      value = value.replace(/^ethereum:/i, '');
    }
    
    setValues((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleChainSelect = (chainId: string) => {
    if (CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES]) {
      setSelectedChain({
        id: chainId,
        name: CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES]
      });
      
      setValues((prev) => ({ ...prev, chainId }));
      setShowChainSelector(false);
      
      // Reset token selection
      setSelectedToken(null);
      setValues((prev) => ({ ...prev, toToken: '' }));
    }
  };

  const handleTokenSelect = (token: TokenInfoDto) => {
    setSelectedToken(token);
    setValues((prev) => ({ ...prev, toToken: token.address }));
    setShowTokenSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form
      sendFormSchema.parse(values);
      
      // If validation passes, attempt to send
      setIsSubmitting(true);
      
      if (values.recipient && values.amount) {
        // Remove ethereum: prefix if present
        const cleanRecipient = values.recipient.replace(/^ethereum:/i, '');
        await onSend(
          cleanRecipient, 
          values.amount, 
          values.chainId, 
          values.toToken
        );
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Transform Zod errors into a more usable format
        const newErrors: Partial<Record<keyof SendFormValues, string>> = {};
        
        error.errors.forEach((err) => {
          if (err.path[0]) {
            const field = err.path[0] as keyof SendFormValues;
            newErrors[field] = err.message;
          }
        });
        
        setErrors(newErrors);
      } else {
        console.error('Error submitting form:', error);
        toast({
          title: "Error",
          description: "Failed to process your transaction",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Send USDC</CardTitle>
        <CardDescription>Send USDC to any Ethereum address without paying gas fees</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={values.recipient || ''}
              onChange={(e) => handleChange('recipient', e.target.value)}
              className={errors.recipient ? "border-red-500" : ""}
            />
            {errors.recipient && (
              <p className="text-sm text-red-500">{errors.recipient}</p>
            )}
          </div>
          
          {/* Target Chain Selector */}
          <div className="space-y-2">
            <Label>Target Chain</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowChainSelector(!showChainSelector)}
                className="w-full flex items-center justify-between px-4 py-2 border rounded-md"
                aria-label={`Select target blockchain, currently: ${selectedChain?.name || 'none selected'}`}
              >
                <span>{selectedChain?.name || 'Select Chain'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showChainSelector && (
                <div className="absolute left-0 right-0 mt-1 p-2 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-10">
                  <div className="text-sm text-gray-500 px-2 py-1 border-b mb-2">Select Chain</div>
                  {Object.entries(CHAIN_NAMES).map(([id, name]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleChainSelect(id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md ${
                        values.chainId === id ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      aria-label={`Select ${name} blockchain`}
                    >
                      <span>{name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Token Selector */}
          <div className="space-y-2">
            <Label>Recipient Token</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTokenSelector(!showTokenSelector)}
                className="w-full flex items-center justify-between px-4 py-2 border rounded-md"
                disabled={isLoadingTokens}
              >
                {isLoadingTokens ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading tokens...</span>
                  </div>
                ) : selectedToken ? (
                  <div className="flex items-center gap-2">
                    {selectedToken.logoURI && (
                      <img 
                        src={selectedToken.logoURI}
                        alt={selectedToken.name}
                        width={20}
                        height={20}
                        className="rounded-full"
                        onError={(e) => {
                          // Fallback when image fails to load
                          (e.target as HTMLImageElement).src = "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png";
                        }}
                      />
                    )}
                    <span>{selectedToken.symbol}</span>
                  </div>
                ) : (
                  <span>Select Token</span>
                )}
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showTokenSelector && (
                <div className="absolute left-0 right-0 mt-1 p-2 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-gray-800 pb-2">
                    <div className="text-sm text-gray-500 px-2 py-1 border-b mb-2">Select Token</div>
                    <div className="px-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search name or paste address"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {isLoadingTokens ? (
                    <div className="flex justify-center items-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  ) : filteredTokens.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No tokens found</div>
                  ) : (
                    filteredTokens.map((token) => (
                      <button
                        key={token.address}
                        type="button"
                        onClick={() => handleTokenSelect(token)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          {token.logoURI && (
                            <img 
                              src={token.logoURI}
                              alt={token.name}
                              width={24}
                              height={24}
                              className="rounded-full"
                              onError={(e) => {
                                // Fallback when image fails to load
                                (e.target as HTMLImageElement).src = "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png";
                              }}
                            />
                          )}
                          <div className="text-left">
                            <div>{token.symbol}</div>
                            <div className="text-xs text-gray-500">{token.name}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="amount">Amount</Label>
              <span className="text-sm text-gray-500">
                Available: {maxAmount} USDC
              </span>
            </div>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              max={maxAmount.toString()}
              value={values.amount || ''}
              onChange={(e) => handleChange('amount', e.target.value)}
              className={errors.amount ? "border-red-500" : ""}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send USDC'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
