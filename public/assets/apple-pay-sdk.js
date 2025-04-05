/**
 * Apple Pay SDK Mock
 * This is a simplified version for demonstration purposes
 */

(function(window) {
  console.log('Apple Pay SDK loaded');
  
  // Only create the PaymentRequest if it doesn't already exist
  if (!window.PaymentRequest) {
    window.PaymentRequest = class PaymentRequest {
      constructor(methodData, details) {
        this.methodData = methodData;
        this.details = details;
      }
      
      canMakePayment() {
        return Promise.resolve(true);
      }
      
      show() {
        console.log('Payment Request Show', this.details);
        
        // Simulate a successful payment after a short delay
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              complete: (status) => {
                console.log('Payment completed with status:', status);
                return Promise.resolve();
              },
              methodName: 'https://apple.com/apple-pay',
              details: {
                token: {
                  paymentMethod: {
                    network: 'visa',
                    type: 'debit',
                    displayName: 'Visa •••• 1234'
                  }
                }
              }
            });
          }, 1000);
        });
      }
    };
  }
})(window);
