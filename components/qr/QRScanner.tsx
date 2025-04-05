'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, QrCode } from 'lucide-react';

interface QRScannerModalProps {
  onClose: () => void;
  onResult?: (result: string) => void;
}

export function QRScannerModal({ onClose, onResult }: QRScannerModalProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      if (onResult) {
        // 如果提供了結果回調，則使用回調
        onResult(address);
      } else {
        // 否則使用原有的導航方式
        router.push(`/intent-pay?address=${address}`);
      }
      onClose();
    }, 1000);
  };
  
  // 處理Demo掃描
  const handleDemoScan = () => {
    handleScan('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  };

  // 初始化攝像頭
  useEffect(() => {
    if (!scanning) return;
    
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // 必須在iOS上
          videoRef.current.play();
          scanQRCode();
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasError(true);
        setErrorMessage('無法訪問相機。請確保您已授予相機權限。');
      }
    };
    
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [scanning]);
  
  // 掃描QR碼
  const scanQRCode = () => {
    if (!scanning) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      // 如果視訊還沒準備好，等待下一幀
      requestAnimationFrame(scanQRCode);
      return;
    }
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 使用URL發送圖像到後端進行處理（模擬）
    // 在實際產品中，您可能需要整合專門的QR庫或使用服務器端處理
    
    // 這裡我們簡單模擬檢測，實際應用中需要替換為真實QR碼檢測邏輯
    setTimeout(() => {
      // 模擬隨機檢測（實際應用中需替換）
      const shouldDetect = Math.random() < 0.01; // 1%的機率檢測到
      
      if (shouldDetect) {
        handleDemoScan(); // 使用演示地址
      } else {
        requestAnimationFrame(scanQRCode);
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <h3 className="font-medium">掃描錢包地址</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          {scanning && !hasError ? (
            <div className="relative aspect-square w-full max-w-xs mx-auto overflow-hidden rounded-lg bg-muted">
              <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover"
                playsInline 
                muted
              />
              <canvas 
                ref={canvasRef} 
                className="hidden" // 隱藏畫布，僅用於處理
              />
              <div className="absolute inset-0 border-2 border-primary border-opacity-50 rounded-lg pointer-events-none"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-2 border-white rounded-lg"></div>
              </div>
            </div>
          ) : hasError ? (
            <div className="text-center p-6">
              <div className="p-3 bg-red-100 rounded-full inline-flex mb-3">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-medium text-lg mb-2">相機訪問錯誤</h3>
              <p className="text-muted-foreground mb-4">
                {errorMessage}
              </p>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                關閉
              </button>
            </div>
          ) : isLoadingResult ? (
            <div className="text-center p-6">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">處理掃描結果...</p>
            </div>
          ) : null}
        </div>
        
        {scanning && !hasError && (
          <div className="p-4 border-t bg-muted/50">
            <p className="text-sm text-muted-foreground mb-3">
              將相機對準錢包二維碼進行掃描。確保掃描區域光線充足並穩定。
            </p>
            <button
              onClick={handleDemoScan}
              className="w-full py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors"
            >
              使用演示地址
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
