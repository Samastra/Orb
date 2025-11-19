declare global {
  interface Window {
    Paddle: any; // Paddle's types are a bit loose; you can refine if you want
  }
}

let paddleLoaded = false;

export const loadPaddle = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  if (window.Paddle && paddleLoaded) return true;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;

    script.onload = () => {
      try {
        const env = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT; // 'sandbox' or 'production'

        if (env === 'sandbox') {
          window.Paddle.Environment.set('sandbox');
        } // else defaults to production

        window.Paddle.Initialize({
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!, // must be test_... or live_...
          // you can add default settings here if you want
        });

        paddleLoaded = true;
        console.log('✅ Paddle.js loaded and initialized');
        resolve(true);
      } catch (err) {
        console.error('Paddle init failed', err);
        resolve(false);
      }
    };

    script.onerror = () => {
      console.error('Failed to load Paddle.js script');
      resolve(false);
    };

    document.head.appendChild(script);
  });
};

export const openPaddleCheckout = (priceId: string, email?: string) => {
  if (!window.Paddle) {
    console.error('Paddle not loaded yet');
    return;
  }

  console.log('Opening Paddle checkout →', priceId);

  window.Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: email ? { email } : undefined,
    settings: {
      successUrl: 'https://www.orblin.cloud/payment-success',
      // displayMode: 'overlay', // optional, default is overlay
    },
  });
};