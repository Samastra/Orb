declare global {
  interface Window {
    Paddle: {
      Initialize: (config: { 
        environment: 'production' | 'sandbox'; 
        token: string 
      }) => void;
      Checkout: {
        open: (options: {
          items: Array<{ priceId: string; quantity: number }>;
          customer?: { email?: string };
          settings?: { successUrl: string };
        }) => void;
      };
      Environment: {
        set: (environment: 'production' | 'sandbox') => void;
      };
      Spinner: {
        hide: () => void;
      };
    };
  }
}

let paddleLoaded = false;

export const loadPaddle = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  // If already loaded, return true
  if (window.Paddle) {
    paddleLoaded = true;
    return true;
  }
  
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.onload = () => {
      window.Paddle.Initialize({
        environment: 'production',
        token: 'pdl_live_apikey_01kab6dq8911kgq6wycw9vjwkw_pPTQy0ewZGB6sXZWs6wjm7_AGC'
      });
      paddleLoaded = true;
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Paddle.js');
      resolve(false);
    };
    document.head.appendChild(script);
  });
};

export const isPaddleLoaded = () => paddleLoaded;

// Helper function to open checkout with proper success URL
export const openPaddleCheckout = (priceId: string, email?: string) => {
  if (!window.Paddle) {
    console.error('Paddle not loaded');
    return;
  }
  
  window.Paddle.Checkout.open({
    items: [
      {
        priceId: priceId,
        quantity: 1,
      }
    ],
    customer: email ? { email } : undefined,
    settings: {
      successUrl: 'https://www.orblin.cloud/payment-success',
    }
  });
};