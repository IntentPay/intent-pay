import React, { useRef, useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        setError(null);
        setScanning(true);
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
        }
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Camera access denied or not available');
        setScanning(false);
      }
    };
    
    const stopCamera = () => {
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => {
          track.stop();
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setScanning(false);
    };
    
    if (isOpen) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);
  
  const tick = () => {
    if (!scanning) return;
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      
      requestAnimationFrame(tick);
    }
  };

  const handleManualEntry = () => {
    const address = prompt('Enter Ethereum address:', '0x');
    if (address) {
      if (/^(0x)?[0-9a-fA-F]{40}$/.test(address)) {
        setScanning(false);
        onScan(address);
      } else {
        alert('Invalid Ethereum address format');
      }
    }
  };
  
  const provideMockAddress = (address: string) => {
    setScanning(false);
    onScan(address);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-900 p-4 rounded-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Scan QR Code</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            title="Close scanner"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-20 p-4">
              <p className="text-white text-center">{error}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" />
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full hidden" />
              <div className="absolute inset-0 border-2 border-blue-500 opacity-50 pointer-events-none rounded-2xl" />
            </>
          )}
        </div>
        
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-center text-gray-300 text-sm">
            Point your camera at a QR code containing an Ethereum address
          </p>
          
          <button
            onClick={handleManualEntry}
            className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Enter Address Manually
          </button>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 border border-gray-700 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Test Options (Development Only)</p>
              <div className="flex gap-2">
                <button
                  onClick={() => provideMockAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')}
                  className="flex-1 bg-green-800 text-white py-1 px-2 rounded text-xs"
                >
                  Test Address 1
                </button>
                <button
                  onClick={() => provideMockAddress('0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc')}
                  className="flex-1 bg-green-800 text-white py-1 px-2 rounded text-xs"
                >
                  Test Address 2
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;
