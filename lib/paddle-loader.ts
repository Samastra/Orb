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
      Spinner: { show: () => void; hide: () => void };
    };
  }
}

let paddleLoaded = false;

// Validate environment on module load
const PADDLE_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
if (!PADDLE_TOKEN) {
  console.error('❌ PADDLE CRITICAL ERROR: NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is missing from environment variables');
} else {
  console.log('✅ Paddle token found:', PADDLE_TOKEN.substring(0, 10) + '...');
}

export const loadPaddle = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  // Check if already loaded
  if (window.Paddle && paddleLoaded) {
    console.log('✅ Paddle already loaded');
    return true;
  }

  // Validate token exists
  if (!PADDLE_TOKEN) {
    console.error('❌ Cannot load Paddle: Missing token');
    return false;
  }

  return new Promise<boolean>((resolve) => {
    // Check if Paddle is already available (might be loaded by another script)
    if (window.Paddle) {
      console.log('🔄 Paddle found on window, initializing...');
      try {
        window.Paddle.Initialize({ token: PADDLE_TOKEN });
        paddleLoaded = true;
        console.log('✅ Paddle initialized successfully');
        resolve(true);
      } catch (err) {
        console.error('❌ Paddle initialization failed:', err);
        resolve(false);
      }
      return;
    }

    console.log('🔄 Loading Paddle script...');
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;

    script.onload = () => {
      console.log('✅ Paddle script loaded, initializing...');
      
      // Small delay to ensure Paddle is ready
      setTimeout(() => {
        try {
          if (!window.Paddle) {
            throw new Error('Paddle not available on window after script load');
          }

          window.Paddle.Initialize({ token: PADDLE_TOKEN });
          paddleLoaded = true;
          console.log('✅ Paddle initialized successfully in production');
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

    document.head.appendChild(script);
  });
};

export const openPaddleCheckout = (priceId: string, email?: string) => {
  console.log('🔄 openPaddleCheckout called with:', { priceId, email: email ? 'email provided' : 'no email' });

  if (!window.Paddle) {
    console.error('❌ Paddle is not loaded yet');
    // Try to load it dynamically
    loadPaddle().then(loaded => {
      if (loaded) {
        console.log('🔄 Paddle loaded dynamically, retrying checkout...');
        openPaddleCheckout(priceId, email);
      }
    });
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