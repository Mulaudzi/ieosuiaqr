import { useCallback, useEffect, useState } from 'react';

// reCAPTCHA v3 site key - this is public and safe to expose
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface UseRecaptchaReturn {
  executeRecaptcha: (action: string) => Promise<string | null>;
  isLoaded: boolean;
  isEnabled: boolean;
}

let isScriptLoading = false;
let isScriptLoaded = false;

export function useRecaptcha(): UseRecaptchaReturn {
  const [isLoaded, setIsLoaded] = useState(isScriptLoaded);
  const isEnabled = Boolean(RECAPTCHA_SITE_KEY);

  useEffect(() => {
    // If no site key configured, skip loading
    if (!RECAPTCHA_SITE_KEY) {
      return;
    }

    // If already loaded, update state
    if (isScriptLoaded) {
      setIsLoaded(true);
      return;
    }

    // If already loading, wait for it
    if (isScriptLoading) {
      const checkLoaded = setInterval(() => {
        if (isScriptLoaded) {
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // Load the script
    isScriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.grecaptcha.ready(() => {
        isScriptLoaded = true;
        isScriptLoading = false;
        setIsLoaded(true);
      });
    };

    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script');
      isScriptLoading = false;
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove the script on unmount as other components may need it
    };
  }, []);

  const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
    // If not enabled (no site key), return null
    if (!RECAPTCHA_SITE_KEY) {
      return null;
    }

    // Wait for script to load if not ready
    if (!isScriptLoaded || !window.grecaptcha) {
      console.warn('reCAPTCHA not loaded yet');
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
      return token;
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error);
      return null;
    }
  }, []);

  return {
    executeRecaptcha,
    isLoaded,
    isEnabled
  };
}
