// lib/paddle-loader.ts

declare global {
  interface Window {
    Paddle?: {
      Initialize: (options: { token: string }) => void;
      Checkout: {
        open: (options: {
          items: Array<{ priceId: string; quantity: number }>;
          customer?: { email?: string };
          settings?: { successUrl?: string; displayMode?: 'overlay' | 'inline' };
        }) => void;
      };
    };
  }
}

let paddleLoaded = false;

export const loadPaddle = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  // Clear any existing Paddle instance
  if (window.Paddle) {
    delete window.Paddle;
  }
  paddleLoaded = false;

  const PADDLE_TOKEN = 'live_1eb16e45439c74060060a87a068'; // Hardcode for now to test
  
  return new Promise<boolean>((resolve) => {
    console.log('🔄 Loading Paddle with token:', PADDLE_TOKEN);

    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;

    script.onload = () => {
      setTimeout(() => {
        try {
          if (!window.Paddle) {
            throw new Error('Paddle not available after script load');
          }

          window.Paddle.Initialize({ token: PADDLE_TOKEN });
          paddleLoaded = true;
          console.log('✅ Paddle initialized with correct token');
          resolve(true);
        } catch (err) {
          console.error('❌ Paddle initialization failed:', err);
          resolve(false);
        }
      }, 100);
    };

    script.onerror = () => {
      console.error('❌ Failed to load Paddle.js script');
      resolve(false);
    };

    // Remove any existing Paddle scripts first
    const existingScripts = document.querySelectorAll('script[src*="paddle.com"]');
    existingScripts.forEach(script => script.remove());

    document.head.appendChild(script);
  });
};

export const openPaddleCheckout = (priceId: string, email?: string) => {
  console.log('🔄 openPaddleCheckout called with:', { priceId, email: email ? 'email provided' : 'no email' });

  if (!window.Paddle) {
    console.error('❌ Paddle is not loaded yet');
    return;
  }

  if (!window.Paddle.Checkout) {
    console.error('❌ Paddle.Checkout is not available');
    return;
  }

  console.log('🎯 Opening Paddle checkout...');
  
  try {
    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      ...(email && { customer: { email } }),
      settings: {
        successUrl: 'https://www.orblin.cloud/payment-success',
        displayMode: 'overlay',
      },
    });
    console.log('✅ Paddle checkout opened successfully');
  } catch (error) {
    console.error('❌ Paddle checkout error:', error);
  }
};