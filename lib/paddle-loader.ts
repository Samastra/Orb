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
            displayMode?: 'overlay' | 'inline';  // ← only these two exist (no wide-overlay)
            frameTarget?: string;                // required for inline
            frameInitialHeight?: string;         // recommended for inline
            frameStyle?: string;                 // recommended for inline
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
    script.src = `https://cdn.paddle.com/paddle/v2/paddle.js?t=${Date.now()}`;
    script.async = true;

    script.onload = () => {
      try {
        const env = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT;

        if (env === 'sandbox') {
          window.Paddle!.Environment.set('sandbox');
        }

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

  // Switch to inline mode — this completely bypasses the third-party cookie partitioning issue
  // that causes "Something went wrong" in live overlay mode in 2025 browsers
  window.Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    ...(email && { customer: { email } }),
    settings: {
      successUrl: 'https://www.orblin.cloud/payment-success',
      displayMode: 'inline',                // ← the fix
      frameTarget: 'paddle-checkout-container',  // must match the div class/id below
      frameInitialHeight: '650',            // tall enough for one-page checkout + footer
      frameStyle: 'width: 100%; max-width: 800px; min-width: 312px; background-color: transparent; border: none; margin: 0 auto;',
    },
  });
};