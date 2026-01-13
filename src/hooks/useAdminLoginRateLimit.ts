import { useState, useCallback } from 'react';

const ADMIN_LOGIN_ATTEMPTS_KEY = 'admin_login_attempts';
const ADMIN_LOGIN_LOCKOUT_KEY = 'admin_login_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

interface LoginAttempt {
  timestamp: number;
  email: string;
  success: boolean;
  ip?: string;
  userAgent?: string;
}

export function useAdminLoginRateLimit() {
  const [isLocked, setIsLocked] = useState(() => {
    const lockoutUntil = localStorage.getItem(ADMIN_LOGIN_LOCKOUT_KEY);
    if (lockoutUntil) {
      const lockTime = parseInt(lockoutUntil, 10);
      if (Date.now() < lockTime) {
        return true;
      }
      localStorage.removeItem(ADMIN_LOGIN_LOCKOUT_KEY);
    }
    return false;
  });

  const [remainingAttempts, setRemainingAttempts] = useState(() => {
    const attempts = getRecentAttempts();
    return Math.max(0, MAX_ATTEMPTS - attempts.length);
  });

  function getRecentAttempts(): LoginAttempt[] {
    try {
      const data = localStorage.getItem(ADMIN_LOGIN_ATTEMPTS_KEY);
      if (!data) return [];
      
      const attempts: LoginAttempt[] = JSON.parse(data);
      const cutoff = Date.now() - LOCKOUT_DURATION;
      return attempts.filter(a => a.timestamp > cutoff && !a.success);
    } catch {
      return [];
    }
  }

  const getLockoutRemaining = useCallback(() => {
    const lockoutUntil = localStorage.getItem(ADMIN_LOGIN_LOCKOUT_KEY);
    if (!lockoutUntil) return 0;
    
    const remaining = parseInt(lockoutUntil, 10) - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000 / 60)); // minutes
  }, []);

  const logAttempt = useCallback((email: string, success: boolean) => {
    const attempt: LoginAttempt = {
      timestamp: Date.now(),
      email,
      success,
      userAgent: navigator.userAgent,
    };

    const attempts = getRecentAttempts();
    attempts.push(attempt);
    
    // Keep only recent attempts
    const recentAttempts = attempts.filter(a => a.timestamp > Date.now() - LOCKOUT_DURATION);
    localStorage.setItem(ADMIN_LOGIN_ATTEMPTS_KEY, JSON.stringify(recentAttempts));

    // Also log to console for debugging (would be sent to backend in production)
    console.log(`[Admin Login Attempt] ${new Date().toISOString()}`, {
      email,
      success,
      attemptNumber: recentAttempts.filter(a => !a.success).length,
    });

    if (success) {
      // Clear failed attempts on success
      localStorage.removeItem(ADMIN_LOGIN_ATTEMPTS_KEY);
      localStorage.removeItem(ADMIN_LOGIN_LOCKOUT_KEY);
      setIsLocked(false);
      setRemainingAttempts(MAX_ATTEMPTS);
    } else {
      const failedAttempts = recentAttempts.filter(a => !a.success);
      const remaining = Math.max(0, MAX_ATTEMPTS - failedAttempts.length);
      setRemainingAttempts(remaining);

      if (failedAttempts.length >= MAX_ATTEMPTS) {
        const lockoutUntil = Date.now() + LOCKOUT_DURATION;
        localStorage.setItem(ADMIN_LOGIN_LOCKOUT_KEY, lockoutUntil.toString());
        setIsLocked(true);
        console.warn(`[Admin Login] Account locked for admin: ${email}`);
      }
    }
  }, []);

  const checkRateLimit = useCallback((): { allowed: boolean; message?: string } => {
    const lockoutUntil = localStorage.getItem(ADMIN_LOGIN_LOCKOUT_KEY);
    if (lockoutUntil) {
      const lockTime = parseInt(lockoutUntil, 10);
      if (Date.now() < lockTime) {
        const minutes = Math.ceil((lockTime - Date.now()) / 1000 / 60);
        return {
          allowed: false,
          message: `Too many failed attempts. Please try again in ${minutes} minute(s).`,
        };
      }
      // Lockout expired
      localStorage.removeItem(ADMIN_LOGIN_LOCKOUT_KEY);
      localStorage.removeItem(ADMIN_LOGIN_ATTEMPTS_KEY);
      setIsLocked(false);
      setRemainingAttempts(MAX_ATTEMPTS);
    }

    return { allowed: true };
  }, []);

  return {
    isLocked,
    remainingAttempts,
    logAttempt,
    checkRateLimit,
    getLockoutRemaining,
  };
}
