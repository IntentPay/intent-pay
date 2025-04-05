'use client';

import { useEffect } from 'react';

interface ApplePayButtonProps {
  amount: string | number; // 傳入的金額
  label?: string; // 註明
  onSuccess?: () => void; // Add success callback
  onError?: () => void; // Add error callback
}

const ApplePayButton: React.FC<ApplePayButtonProps> = ({ 
  amount, 
  label = 'Demo (Card is not charged)',
  onSuccess,
  onError
}) => {
  // 在頁面載入時加載 Apple Pay SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/assets/apple-pay-sdk.js'; // 使用本地 public 目錄中的 SDK 文件
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Apple Pay 按鈕被點擊時的處理函數
  const onApplePayButtonClicked = async () => {
    // 確保 PaymentRequest 可用
    if (!window.PaymentRequest) {
      console.error('Apple Pay is not supported in this browser.');
      onError?.(); // Call error callback if provided
      return;
    }

    try {
      // 定義 PaymentMethodData
      const paymentMethodData = [
        {
          supportedMethods: 'https://apple.com/apple-pay',
          data: {
            version: 3,
            merchantIdentifier: 'merchant.com.apdemo',
            merchantCapabilities: ['supports3DS'],
            supportedNetworks: ['amex', 'discover', 'masterCard', 'visa'],
            countryCode: 'US'
          }
        }
      ];

      // 定義 PaymentDetails
      const paymentDetails = {
        total: {
          label: label,
          amount: {
            currency: 'USD',
            value: typeof amount === 'string' ? amount : amount.toString()
          }
        }
      };

      // 定義 PaymentOptions
      const paymentOptions = {
        requestPayerName: false,
        requestPayerEmail: false,
        requestPayerPhone: false,
        requestShipping: false,
      };

      // 創建 PaymentRequest
      const request = new PaymentRequest(paymentMethodData, paymentDetails, paymentOptions);

      // 處理各種事件
      request.onpaymentmethodchange = (event) => {
        const paymentDetailsUpdate = {
          total: paymentDetails.total
        };
        event.updateWith(paymentDetailsUpdate);
      };

      request.onshippingoptionchange = (event) => {
        const paymentDetailsUpdate = {
          total: paymentDetails.total
        };
        event.updateWith(paymentDetailsUpdate);
      };

      request.onshippingaddresschange = (event) => {
        const paymentDetailsUpdate = {};
        event.updateWith(paymentDetailsUpdate);
      };

      // 顯示支付界面
      const response = await request.show();
      const status = 'success';
      await response.complete(status);
      console.log('Apple Pay payment successful', response);
      onSuccess?.(); // Call success callback if provided
    } catch (error) {
      console.error('Apple Pay payment failed', error);
      onError?.(); // Call error callback if provided
    }
  };

  return (
    <button className="w-full bg-black text-white rounded-xl py-2" onClick={onApplePayButtonClicked}>
      Buy with  Pay
    </button>
  );
};

export default ApplePayButton;
