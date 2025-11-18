// This loads Paddle.js on your site
export const initializePaddle = async () => {
  if (typeof window !== 'undefined' && !window.Paddle) {
    // Load Paddle.js
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    document.head.appendChild(script);

    await new Promise((resolve) => {
      script.onload = resolve;
    });

    // Initialize Paddle
    window.Paddle.Initialize({
      environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    });
  }
};