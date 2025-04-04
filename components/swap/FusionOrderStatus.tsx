'use client';

import { useState, useEffect } from 'react';
import { getOrderStatus } from '@/lib/1inch/fusion';
import { SUPPORTED_CHAINS, CHAIN_NAMES } from '@/lib/1inch/config';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { Loader2, Check, XCircle, Clock, RefreshCw, ChevronRight } from 'lucide-react';

// Status mapping for display
const STATUS_DISPLAY: Record<string, { label: string, color: string, icon: React.ReactNode }> = {
  'unknown': { 
    label: 'Unknown', 
    color: 'bg-gray-100 text-gray-600', 
    icon: <Clock className="h-4 w-4" /> 
  },
  'creating': { 
    label: 'Creating', 
    color: 'bg-blue-100 text-blue-600', 
    icon: <Loader2 className="h-4 w-4 animate-spin" /> 
  },
  'pending': { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-600', 
    icon: <Clock className="h-4 w-4" /> 
  },
  'active': { 
    label: 'Active', 
    color: 'bg-indigo-100 text-indigo-600', 
    icon: <Clock className="h-4 w-4" /> 
  },
  'filled': { 
    label: 'Filled', 
    color: 'bg-green-100 text-green-600', 
    icon: <Check className="h-4 w-4" /> 
  },
  'cancelled': { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-600', 
    icon: <XCircle className="h-4 w-4" /> 
  },
  'expired': { 
    label: 'Expired', 
    color: 'bg-orange-100 text-orange-600', 
    icon: <Clock className="h-4 w-4" /> 
  }
};

// Format timestamp to human-readable date
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

// Helper to truncate addresses
const truncateAddress = (address: string, firstChars = 6, lastChars = 4): string => {
  if (!address) return '';
  return `${address.slice(0, firstChars)}...${address.slice(-lastChars)}`;
};

export function FusionOrderStatus() {
  const { toast } = useToast();
  const [orderId, setOrderId] = useState<string>('');
  const [chainId, setChainId] = useState<number>(42161); // Default to Arbitrum
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Load last order from localStorage
  useEffect(() => {
    const lastOrderId = localStorage.getItem('lastFusionOrderId');
    const lastChainId = localStorage.getItem('lastFusionChainId');
    
    if (lastOrderId) {
      setOrderId(lastOrderId);
    }
    
    if (lastChainId) {
      setChainId(Number(lastChainId));
    }
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const fetchOrderStatus = async () => {
    if (!orderId) {
      toast({
        title: "Order ID Required",
        description: "Please enter an order ID to check its status",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const status = await getOrderStatus(chainId, orderId);
      setOrderDetails(status);
      
      // Auto-refresh if order is not in a final state
      const finalStates = ['filled', 'cancelled', 'expired'];
      if (!finalStates.includes(status.status)) {
        startPolling();
      } else if (refreshInterval) {
        clearInterval(refreshInterval);
        setIsPolling(false);
        setRefreshInterval(null);
      }
      
      toast({
        title: "Status Updated",
        description: `Order is ${status.status}`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error fetching order status:', error);
      setError(error.response?.data?.message || 'Failed to fetch order status');
      setOrderDetails(null);
      
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to fetch order status',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    setIsPolling(true);
    const interval = setInterval(() => {
      fetchOrderStatus();
    }, 15000); // Poll every 15 seconds
    
    setRefreshInterval(interval);
  };

  const stopPolling = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    setIsPolling(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>Check Order Status</span>
      </h2>
      
      <div className="space-y-4">
        {/* Network Selector */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Network</label>
          <div className="relative">
            <select 
              className="w-full p-2.5 pl-10 border rounded-lg bg-gray-50 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={chainId.toString()} 
              onChange={(e) => setChainId(Number(e.target.value))}
              aria-label="Select Network"
            >
              <option value="42161">Arbitrum</option>
              <option value="1">Ethereum</option>
              <option value="8453">Base</option>
              <option value="43114">Avalanche</option>
            </select>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
            </div>
          </div>
        </div>
        
        {/* Order ID Input */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Order ID</label>
          <div className="flex gap-2">
            <input 
              className="flex-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter order ID" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
            <Button
              onClick={fetchOrderStatus}
              disabled={isLoading || !orderId}
              className="flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Check
                </span>
              )}
            </Button>
          </div>
        </div>
        
        {/* Auto-refresh toggle */}
        {orderDetails && (
          <div className="flex items-center gap-2">
            <Button
              variant={isPolling ? "destructive" : "outline"}
              size="sm"
              onClick={isPolling ? stopPolling : startPolling}
              className="text-xs"
            >
              {isPolling ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Stop Auto-refresh
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Auto-refresh
                </span>
              )}
            </Button>
            
            <span className="text-xs text-gray-500">
              {isPolling ? "Refreshing every 15 seconds" : "Updates paused"}
            </span>
          </div>
        )}
        
        {/* Error display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
        
        {/* Order details */}
        {orderDetails && (
          <div className="mt-4">
            <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
              {/* Status header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Order Status:</span>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${STATUS_DISPLAY[orderDetails.status]?.color || STATUS_DISPLAY.unknown.color}`}>
                    {STATUS_DISPLAY[orderDetails.status]?.icon || STATUS_DISPLAY.unknown.icon}
                    {STATUS_DISPLAY[orderDetails.status]?.label || 'Unknown'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
              
              {/* Order details grid */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Order Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Order ID:</span>
                      <span className="text-sm font-mono">{truncateAddress(orderDetails.id, 8, 6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm">{formatDate(orderDetails.createDateTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Network:</span>
                      <span className="text-sm">{CHAIN_NAMES[chainId.toString() as keyof typeof CHAIN_NAMES] || 'Unknown Network'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Swap Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">From Token:</span>
                      <span className="text-sm font-mono">{truncateAddress(orderDetails.makerAsset, 6, 4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">To Token:</span>
                      <span className="text-sm font-mono">{truncateAddress(orderDetails.takerAsset, 6, 4)}</span>
                    </div>
                    {orderDetails.takingAmount && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Amount In:</span>
                        <span className="text-sm font-medium">{orderDetails.makingAmount}</span>
                      </div>
                    )}
                    {orderDetails.filledTakingAmount && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Amount Out:</span>
                        <span className="text-sm font-medium">{orderDetails.filledTakingAmount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Transaction info if available */}
              {orderDetails.tx && (
                <div className="p-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Transaction Details</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono">{truncateAddress(orderDetails.tx.hash, 8, 8)}</span>
                    <a 
                      href={`https://${chainId === 1 ? '' : CHAIN_NAMES[chainId.toString() as keyof typeof CHAIN_NAMES].toLowerCase() + '.'}etherscan.io/tx/${orderDetails.tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 flex items-center gap-1 text-sm"
                    >
                      View on Explorer
                      <ChevronRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
