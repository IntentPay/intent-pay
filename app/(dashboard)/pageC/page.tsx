'use client';

import { useState } from 'react';
import { getSupportedChains, getSupportedProtocols } from '@/lib/1inch/portfolio';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PortfolioTestPage() {
  const [chains, setChains] = useState<any>(null);
  const [protocols, setProtocols] = useState<any>(null);
  const [loading, setLoading] = useState({
    chains: false,
    protocols: false,
  });
  const [error, setError] = useState({
    chains: '',
    protocols: '',
  });

  const fetchSupportedChains = async () => {
    setLoading(prev => ({ ...prev, chains: true }));
    setError(prev => ({ ...prev, chains: '' }));
    try {
      const data = await getSupportedChains();
      setChains(data);
    } catch (err) {
      setError(prev => ({ ...prev, chains: 'Failed to fetch supported chains' }));
      console.error('Error:', err);
    } finally {
      setLoading(prev => ({ ...prev, chains: false }));
    }
  };

  const fetchSupportedProtocols = async () => {
    setLoading(prev => ({ ...prev, protocols: true }));
    setError(prev => ({ ...prev, protocols: '' }));
    try {
      const data = await getSupportedProtocols();
      setProtocols(data);
    } catch (err) {
      setError(prev => ({ ...prev, protocols: 'Failed to fetch supported protocols' }));
      console.error('Error:', err);
    } finally {
      setLoading(prev => ({ ...prev, protocols: false }));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Portfolio API Test</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Supported Chains Card */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Chains</CardTitle>
            <CardDescription>Test the getSupportedChains API endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={fetchSupportedChains}
                disabled={loading.chains}
              >
                {loading.chains ? 'Loading...' : 'Fetch Supported Chains'}
              </Button>
              
              {error.chains && (
                <div className="text-red-500">{error.chains}</div>
              )}
              
              {chains && (
                <pre className="bg-slate-100 p-4 rounded-lg overflow-auto max-h-[400px]">
                  {JSON.stringify(chains, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supported Protocols Card */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Protocols</CardTitle>
            <CardDescription>Test the getSupportedProtocols API endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={fetchSupportedProtocols}
                disabled={loading.protocols}
              >
                {loading.protocols ? 'Loading...' : 'Fetch Supported Protocols'}
              </Button>
              
              {error.protocols && (
                <div className="text-red-500">{error.protocols}</div>
              )}
              
              {protocols && (
                <pre className="bg-slate-100 p-4 rounded-lg overflow-auto max-h-[400px]">
                  {JSON.stringify(protocols, null, 2)}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 