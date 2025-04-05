'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, QrCode } from 'lucide-react';
import jsQR from 'jsqr';

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
  const [lastProcessedTime, setLastProcessedTime] = useState(0);
  const processingRef = useRef(false);

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
    // 用一个可靠的演示地址，确保格式正确
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
    if (!scanning || processingRef.current) return;

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

    // 获取图像数据进行QR码识别
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // 防止过于频繁的处理
    const now = Date.now();
    if (now - lastProcessedTime < 200) { // 每200毫秒处理一次
      requestAnimationFrame(scanQRCode);
      return;
    }

    setLastProcessedTime(now);
    processingRef.current = true;

    try {
      // 使用jsQR解析图像数据
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        console.log("QR code detected:", code.data);
        handleScan(code.data);
        return; // 扫描成功，停止继续扫描
      }

      // 未检测到QR码，继续扫描
      processingRef.current = false;
      requestAnimationFrame(scanQRCode);
    } catch (error) {
      console.error('QR scanning error:', error);
      processingRef.current = false;
      requestAnimationFrame(scanQRCode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <h3 className="font-medium">Scan Wallet Address</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
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
              <h3 className="font-medium text-lg mb-2">Camera Access Error</h3>
              <p className="text-muted-foreground mb-4">
                {errorMessage || "Could not access the camera. Please make sure you've granted camera permissions."}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          ) : isLoadingResult ? (
            <div className="text-center p-6">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Processing scan result...</p>
            </div>
          ) : null}

          {/* QR code scanning info */}
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
            <p>Position a QR code within the frame to scan. If you have trouble with scanning, you can use the demo address below.</p>
          </div>

          {/* Manually enter address option */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleDemoScan}
              className="px-4 py-2 text-sm bg-accent hover:bg-accent/80 rounded-md transition-colors"
            >
              Use Demo Address
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
