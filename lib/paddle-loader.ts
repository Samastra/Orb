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
        }) => Promise<void>;
      };
    };
  }
}

export const loadPaddle = async (): Promise<void> => {
  if (typeof window !== 'undefined' && !window.Paddle) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.onload = () => {
        window.Paddle.Initialize({
          environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as 'production' | 'sandbox',
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        });
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
};