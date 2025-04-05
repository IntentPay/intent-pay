'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera } from 'lucide-react';

interface NativeQRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function NativeQRScanner({ onScan, onClose }: NativeQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const scanIntervalRef = useRef<number | null>(null);

  // Function to get user media
  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode, 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });

      // Set the video source
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      // Start scanning for QR codes
      startScanning();

    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError(`Camera access error: ${err.message || 'Unknown error'}`);
      setIsScanning(false);
    }
  };

  // Function to clean up resources
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  // Function to scan frames for QR codes
  const startScanning = () => {
    if (!canvasRef.current || !videoRef.current) return;

    // Set up a canvas context for image processing
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Process frames every 200ms
    scanIntervalRef.current = window.setInterval(() => {
      // Check if the video ref still exists and has enough data
      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }

      // Get video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current frame - video is guaranteed to be non-null here
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // For development, let's handle QR code result directly 
      // In a real QR scanner we'd need to decode the QR code here
      // Since we can't install jsqr or other libraries, we'll add a manual entry option
    }, 200);
  };

  // Setup and cleanup
  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Add a mock scan function for testing
  const mockScan = (text: string) => {
    if (text.trim()) {
      onScan(text);
    }
  };

  // Toggle between front and back camera
  const toggleCamera = () => {
    // First stop the current camera
    stopCamera();
    // Then switch camera mode
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Handle manual input
  const handleManualEntry = () => {
    const address = prompt('Enter Ethereum address:', '0x');
    if (address) {
      // Validate Ethereum address (basic check)
      if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
        onScan(address);
      } else {
        alert('Invalid Ethereum address format');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      <div className="flex justify-between items-center p-4 text-white">
        <h2 className="text-xl font-bold">Scan QR Code</h2>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {error ? (
          <div className="bg-red-500/20 text-red-100 p-4 rounded-lg mb-4">
            <p>{error}</p>
            <p className="text-sm mt-2">
              Please ensure you've given camera permissions to this site.
            </p>
          </div>
        ) : null}

        <div className="relative w-full max-w-md aspect-[3/4] bg-black rounded-2xl overflow-hidden mb-4">
          {/* Corner markers for scanner effect */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-white/70"></div>
          <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-white/70"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-white/70"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-white/70"></div>

          {/* Video preview */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Canvas for processing (hidden) */}
          <canvas 
            ref={canvasRef} 
            className="hidden"
          />
          
          {/* Scan animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-1 bg-primary/80 animate-[scanner_2s_ease-in-out_infinite]"></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center w-full max-w-md">
          <Button
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            onClick={toggleCamera}
          >
            <Camera className="mr-2 h-4 w-4" />
            Switch Camera
          </Button>
          
          <Button
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            onClick={handleManualEntry}
          >
            Enter Address
          </Button>
          
          {/* For development: Mock QR entries */}
          {process.env.NODE_ENV === 'development' && (
            <div className="w-full mt-4 space-y-2">
              <p className="text-white text-center text-sm">Development Testing</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  size="sm"
                  variant="outline"
                  className="bg-emerald-900/30 text-white border-emerald-500/30 hover:bg-emerald-800/50"
                  onClick={() => mockScan('0x67aad1351bb0665d2a560a52bef9ab8621567d25')}
                >
                  Test Address 1
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  className="bg-emerald-900/30 text-white border-emerald-500/30 hover:bg-emerald-800/50"
                  onClick={() => mockScan('0x67aad1351bb0665d2a560a52bef9ab8621567d25')}
                >
                  Test Address 2
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
