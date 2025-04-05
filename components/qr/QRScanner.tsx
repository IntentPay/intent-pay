'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, QrCode } from 'lucide-react';
// @ts-ignore - 忽略類型錯誤，因為模組解析設置的問題
import { QrCodeScanner } from 'react-simple-qr-code-scanner';

interface QRScannerModalProps {
  onClose: () => void;
}

export function QRScannerModal({ onClose }: QRScannerModalProps) {
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  // 處理掃描結果
  const handleScan = (result: string) => {
    if (!result || isLoadingResult) return;
    
    setIsLoadingResult(true);
    setScanning(false);
    
    // 檢查是否為以太坊地址
    const ethAddressRegex = /^(0x)?[0-9a-fA-F]{40}$/;
    let address = result;
    
    if (ethAddressRegex.test(result)) {
      // 確保地址包含0x前綴
      address = result.startsWith('0x') ? result : `0x${result}`;
    }
    
    // 延遲一下以顯示載入狀態
    setTimeout(() => {
      router.push(`/intent-pay?address=${address}`);
      onClose();
    }, 1000);
  };
  
  // 處理Demo掃描
  const handleDemoScan = () => {
    handleScan('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  };

  // 處理錯誤
  const handleError = (error: Error) => {
    console.error('Error accessing camera:', error);
    setHasError(true);
    setErrorMessage('無法訪問攝像頭，請確保您已授權並且設備支持攝像頭');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-md p-4 bg-white rounded-lg shadow-xl">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          aria-label="Close QR scanner"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium">掃描錢包地址 QR 碼</h3>
          <p className="text-sm text-gray-500">掃描後將自動進入轉賬頁面</p>
        </div>
        
        {scanning ? (
          <div className="aspect-square w-full overflow-hidden">
            {hasError ? (
              <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-4">
                <QrCode className="h-16 w-16 text-indigo-600 mb-4" />
                <p className="text-red-500 mb-4 text-center">{errorMessage}</p>
                <button 
                  onClick={handleDemoScan}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm"
                >
                  測試 - 模擬掃描結果
                </button>
              </div>
            ) : (
              <div className="h-full">
                <QrCodeScanner
                  onResult={handleScan}
                  onError={handleError}
                  constraints={{
                    facingMode: "environment"
                  }}
                  containerStyle={{
                    height: '100%',
                    width: '100%',
                    borderRadius: '0.5rem',
                    overflow: 'hidden'
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="border-2 border-indigo-500 rounded-lg w-2/3 h-2/3 flex items-center justify-center">
                    <div className="animate-pulse">
                      <QrCode className="h-12 w-12 text-indigo-500 opacity-70" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin mb-4 mx-auto h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
            <p>正在處理...</p>
          </div>
        )}
        
        <div className="mt-4 flex gap-2">
          <button 
            onClick={handleDemoScan}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
          >
            測試地址
          </button>
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
