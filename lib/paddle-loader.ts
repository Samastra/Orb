declare global {
  interface Window {
    Paddle: any;
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