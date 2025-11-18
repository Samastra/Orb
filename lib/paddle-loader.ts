declare global {
  interface Window {
    Paddle: any;
  }
}

export const loadPaddle = async (): Promise<void> => {
  if (typeof window !== 'undefined' && !window.Paddle) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.onload = () => {
        window.Paddle.Initialize({
          environment: 'production',
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        });
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
};