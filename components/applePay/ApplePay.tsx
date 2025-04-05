'use client';

import { useEffect } from 'react';

interface ApplePayButtonProps {
  amount: string; // 傳入的金額
  label: string; // 註明
}

const ApplePayButton: React.FC<ApplePayButtonProps> = ({ amount, label }) => {
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
          label: label || 'Demo (Card is not charged)',
          amount: {
            value: amount,
            currency: 'USD'
          }
        }
      };

      // 定義 PaymentOptions
      const paymentOptions = {
        requestPayerName: false,
        requestBillingAddress: false,
        requestPayerEmail: false,
        requestPayerPhone: false,
        requestShipping: false,
        shippingType: 'shipping'
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
    } catch (e) {
      // 處理錯誤
      console.error('Apple Pay Error:', e);
    }
  };

  return (
    <button className="w-full bg-black text-white rounded-xl py-2" onClick={onApplePayButtonClicked}>
      Buy with  Pay
    </button>
  );
};

export default ApplePayButton;
