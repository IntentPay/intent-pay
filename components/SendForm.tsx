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
import { ChevronDown, Search, Loader2, Wallet, CreditCard, CircleX, QrCode } from 'lucide-react';
import { useToast } from '@/components/ui/toast/use-toast';
import ApplePayButton from '@/components/applePay/ApplePay';

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
  const [qrScannerActive, setQrScannerActive] = useState(false);

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

  const validateFields = () => {
    try {
      sendFormSchema.parse(values);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof SendFormValues, string>> = {};
        
        error.errors.forEach((err) => {
          if (err.path[0]) {
            const field = err.path[0] as keyof SendFormValues;
            newErrors[field] = err.message;
          }
        });
        
        setErrors(newErrors);
      }
      return false;
    }
  };

  return (
    <Card className="w-full bg-[#10173a] border-[#2a3156] shadow-[0_0_15px_rgba(0,240,255,0.15)] card-hover neon-pulse">
      <CardHeader>
        <CardTitle className="text-white text-xl flex items-center">
          <span className="bg-gradient-to-r from-[#ff2a6d] to-[#d300c5] bg-clip-text text-transparent hologram-text">
            Send Payment
          </span>
        </CardTitle>
        <CardDescription className="text-[#8a8dbd]">
          Enter recipient details and amount
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="recipient" className="text-[#c2c6ff] neon-text">Recipient</Label>
            </div>
            <div className="relative">
              <Input
                id="recipient"
                type="text"
                placeholder="ethereum:0x..."
                value={values.recipient || ''}
                onChange={(e) => handleChange('recipient', e.target.value)}
                className={`bg-[#191d3e] border-[#2a3156] text-white focus:border-[#00f0ff] focus:ring-[#00f0ff] focus:ring-opacity-30 input-focus ${errors.recipient ? "border-[#ff2a6d]" : ""}`}
              />
              {qrScannerActive && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-[#00f0ff] button-hover"
                    onClick={() => setQrScannerActive(false)}
                  >
                    <CircleX className="h-5 w-5" />
                  </Button>
                </div>
              )}
              {!qrScannerActive && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-[#00f0ff] hover:text-[#05ffa1] hover:bg-[#232853] button-hover"
                    onClick={() => setQrScannerActive(true)}
                  >
                    <QrCode className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
            {errors.recipient && (
              <p className="text-sm text-[#ff2a6d] pink-neon-text">{errors.recipient}</p>
            )}

            {qrScannerActive && (
              <div className="mt-4 bg-[#232853] p-4 rounded-xl border border-[#2a3156] glass-effect">
                <div className="flex justify-between mb-2">
                  <h3 className="text-[#c2c6ff] font-medium neon-text">Scan QR Code</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-[#00f0ff] button-hover"
                    onClick={() => setQrScannerActive(false)}
                  >
                    <CircleX className="h-4 w-4" />
                  </Button>
                </div>
                <div className="aspect-square max-w-[250px] mx-auto mb-4 overflow-hidden">
                  {/* QR Scanner Component would go here */}
                  <div className="w-full h-full bg-[#0d1129] rounded-lg flex items-center justify-center hologram">
                    <p className="text-[#8a8dbd] text-sm text-center px-4">QR Scanner Placeholder</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="chain" className="text-[#c2c6ff] neon-text">Chain</Label>
            </div>
            <div className="relative">
              <select
                id="chain"
                value={values.chainId || ''}
                onChange={(e) => handleChange('chainId', e.target.value)}
                className="w-full bg-[#191d3e] border-[#2a3156] rounded-md text-white focus:border-[#00f0ff] focus:ring-[#00f0ff] focus:ring-opacity-30 pl-3 pr-10 py-2 input-focus"
                aria-label="Select blockchain network"
              >
                {Object.entries(SUPPORTED_CHAINS).map(([name, id]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-[#8a8dbd]" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="amount" className="text-[#c2c6ff] neon-text">Amount</Label>
              <span className="text-sm text-[#8a8dbd]">
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
              className={`bg-[#191d3e] border-[#2a3156] text-white focus:border-[#00f0ff] focus:ring-[#00f0ff] focus:ring-opacity-30 input-focus ${errors.amount ? "border-[#ff2a6d]" : ""}`}
            />
            {errors.amount && (
              <p className="text-sm text-[#ff2a6d] pink-neon-text">{errors.amount}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {/* 原始Send USDC按钮和取消按钮 */}
          <div className="flex justify-between gap-2 w-full">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                className="flex-1 border-[#2a3156] text-[#c2c6ff] hover:bg-[#232853] hover:text-white button-hover"
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-[#00f0ff] to-[#05ffa1] hover:opacity-90 text-[#080f36] font-medium transition-all duration-200 button-hover" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                  <span>Sending...</span>
                </div>
              ) : 'Send USDC'}
            </Button>
          </div>
          
          {/* 支付选项分隔线 */}
          <div className="relative w-full flex items-center gap-2 my-2">
            <div className="flex-grow h-px bg-[#2a3156]"></div>
            <span className="text-sm text-[#8a8dbd] hologram-text">Or pay with</span>
            <div className="flex-grow h-px bg-[#2a3156]"></div>
          </div>
          
          {/* 添加World ID支付和Apple Pay按钮 */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              type="button" 
              className="flex-1 bg-gradient-to-r from-[#d300c5] to-[#ff2a6d] hover:opacity-90 text-white font-medium transition-all duration-200 button-hover purple-pulse" 
              onClick={() => {
                // 确保表单验证通过
                if (validateFields()) {
                  // 这里可以处理World ID支付逻辑或者调用相应函数
                  console.log('Processing World ID payment...');
                  // TODO: 实现World ID支付
                }
              }}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Pay with World
            </Button>
            
            <div className="flex-1">
              <ApplePayButton 
                amount={values.amount || '0.00'} 
                label={`Pay ${values.amount || '0.00'} USDC`}
              />
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
