// lib/paddle-loader.ts

declare global {
  interface Window {
    Paddle?: {
      Initialize: (options: { token: string }) => void;
      Environment: { set: (env: 'sandbox' | 'production') => void };
      Checkout: {
        open: (options: {
          items: Array<{ priceId: string; quantity: number }>;
          customer?: { email?: string };
          settings?: {
            successUrl?: string;
            /** This is the key fix for 2025 browser cookie partitioning **/
            displayMode?: 'overlay' | 'wide-overlay' | 'inline';
          };
        }) => void;
      };
      Spinner: { show: () => void; hide: () => void };
    };
  }
}

let paddleLoaded = false;

export const loadPaddle = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  if (window.Paddle && paddleLoaded) return true;

  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    // Optional: bust cache on every load while debugging
    script.src = `https://cdn.paddle.com/paddle/v2/paddle.js?t=${Date.now()}`;
    script.async = true;

    script.onload = () => {
      try {
        const env = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT;

        if (env === 'sandbox') {
          window.Paddle!.Environment.set('sandbox');
        } // else defaults to production

        window.Paddle!.Initialize({
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        });

        paddleLoaded = true;
        console.log('✅ Paddle.js loaded and initialized');
        resolve(true);
      } catch (err) {
        console.error('Paddle initialization failed', err);
        resolve(false);
      }
    };

    script.onerror = () => {
      console.error('Failed to download Paddle.js');
      resolve(false);
    };

    document.head.appendChild(script);
  });
};

export const openPaddleCheckout = (priceId: string, email?: string) => {
  if (!window.Paddle) {
    console.error('Paddle is not loaded yet');
    return;
  }

  console.log('Opening Paddle checkout for price:', priceId);

  window.Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    ...(email && { customer: { email } }),
    settings: {
      successUrl: 'https://www.orblin.cloud/payment-success',
      // THIS IS THE LINE THAT FIXES THE COOKIE PARTITIONING ERROR
      displayMode: 'wide-overlay',
    },
  });
};