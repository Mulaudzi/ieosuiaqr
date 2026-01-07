import { useState, useCallback, useEffect } from "react";

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  storageKey: string;
}

interface RateLimitState {
  attempts: number;
  firstAttemptTime: number;
}

export function useRateLimit({ maxAttempts, windowMs, storageKey }: RateLimitConfig) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(maxAttempts);

  const getState = useCallback((): RateLimitState => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return { attempts: 0, firstAttemptTime: 0 };
    }
    try {
      return JSON.parse(stored);
    } catch {
      return { attempts: 0, firstAttemptTime: 0 };
    }
  }, [storageKey]);

  const setState = useCallback((state: RateLimitState) => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [storageKey]);

  const clearState = useCallback(() => {
    localStorage.removeItem(storageKey);
    setIsBlocked(false);
    setRemainingTime(0);
    setAttemptsLeft(maxAttempts);
  }, [storageKey, maxAttempts]);

  const checkRateLimit = useCallback((): boolean => {
    const state = getState();
    const now = Date.now();

    // Reset if window has passed
    if (state.firstAttemptTime && now - state.firstAttemptTime > windowMs) {
      clearState();
      return true;
    }

    // Check if blocked
    if (state.attempts >= maxAttempts) {
      const timeLeft = windowMs - (now - state.firstAttemptTime);
      setRemainingTime(Math.ceil(timeLeft / 1000));
      setIsBlocked(true);
      setAttemptsLeft(0);
      return false;
    }

    setAttemptsLeft(maxAttempts - state.attempts);
    return true;
  }, [getState, clearState, maxAttempts, windowMs]);

  const recordAttempt = useCallback(() => {
    const state = getState();
    const now = Date.now();

    // Reset if window has passed
    if (state.firstAttemptTime && now - state.firstAttemptTime > windowMs) {
      setState({ attempts: 1, firstAttemptTime: now });
      setAttemptsLeft(maxAttempts - 1);
      return;
    }

    const newAttempts = state.attempts + 1;
    const newState: RateLimitState = {
      attempts: newAttempts,
      firstAttemptTime: state.firstAttemptTime || now,
    };
    setState(newState);

    if (newAttempts >= maxAttempts) {
      const timeLeft = windowMs - (now - newState.firstAttemptTime);
      setRemainingTime(Math.ceil(timeLeft / 1000));
      setIsBlocked(true);
      setAttemptsLeft(0);
    } else {
      setAttemptsLeft(maxAttempts - newAttempts);
    }
  }, [getState, setState, maxAttempts, windowMs]);

  // Update remaining time countdown
  useEffect(() => {
    if (!isBlocked || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearState();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBlocked, remainingTime, clearState]);

  // Initial check
  useEffect(() => {
    checkRateLimit();
  }, [checkRateLimit]);

  const formatRemainingTime = useCallback(() => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [remainingTime]);

  return {
    isBlocked,
    remainingTime,
    attemptsLeft,
    checkRateLimit,
    recordAttempt,
    clearState,
    formatRemainingTime,
  };
}

// Pre-configured rate limiters for common use cases
export const rateLimitConfigs = {
  forgotPassword: {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
    storageKey: "rl_forgot_password",
  },
  resendVerification: {
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    storageKey: "rl_resend_verification",
  },
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    storageKey: "rl_login",
  },
};
