'use client';

import { FusionSwapForm } from '@/components/swap/FusionSwapForm';
import { FusionOrderStatus } from '@/components/swap/FusionOrderStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ArrowRightLeft, History } from 'lucide-react';

export default function SwapPage() {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Intent Trading with 1inch Fusion+</h1>
        <p className="text-gray-600 mt-1">
          Submit trade intents without managing gas fees using 1inch Fusion+ technology
        </p>
      </div>
      
      <Tabs defaultValue="swap" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="swap" className="flex items-center gap-1">
            <ArrowRightLeft size={16} />
            <span>Create Order</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-1">
            <History size={16} />
            <span>Order Status</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="swap" className="mt-0">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <RefreshCw size={20} className="text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800">Gasless Intent Trading</h3>
                <p className="text-sm text-blue-700 mt-0.5">
                  Your trade intent will be executed by professional market makers without requiring gas fees.
                  This offers superior execution and MEV protection.
                </p>
              </div>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <FusionSwapForm />
          </div>
        </TabsContent>
        
        <TabsContent value="orders" className="mt-0">
          <div className="max-w-2xl mx-auto">
            <FusionOrderStatus />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
