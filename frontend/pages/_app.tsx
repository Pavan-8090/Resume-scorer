import '../styles/globals.css';
import type { AppProps } from 'next/app';

// Suppress browser extension errors early
if (typeof window !== 'undefined') {
  // Suppress console errors from browser extensions
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('Cannot redefine property: ethereum') ||
      message.includes('chrome-extension://') ||
      message.includes('moz-extension://') ||
      message.includes('Cannot redefine property')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  // Override Object.defineProperty to catch extension conflicts
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj: any, prop: string, descriptor: PropertyDescriptor) {
    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (e: any) {
      if (
        e.message?.includes('Cannot redefine property') &&
        prop === 'ethereum' &&
        obj === window
      ) {
        // Extension already defined it, ignore
        return obj;
      }
      throw e;
    }
  };
}

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
