import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const ADMIN_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_LAST_ACTIVITY_KEY = 'admin_last_activity';

export function useAdminSession() {
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const updateActivity = useCallback(() => {
    localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, Date.now().toString());
  }, []);

  const clearAdminSession = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
    setIsValidSession(false);
  }, []);

  const checkSession = useCallback(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const lastActivity = localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);

    if (!token) {
      setIsValidSession(false);
      setIsChecking(false);
      return false;
    }

    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed > ADMIN_SESSION_TIMEOUT) {
        clearAdminSession();
        toast({
          title: 'Session Expired',
          description: 'Your admin session has expired due to inactivity. Please log in again.',
          variant: 'destructive',
        });
        navigate('/login', { replace: true });
        return false;
      }
    }

    updateActivity();
    setIsValidSession(true);
    setIsChecking(false);
    return true;
  }, [clearAdminSession, navigate, toast, updateActivity]);

  const requireAdminSession = useCallback(() => {
    if (!checkSession()) {
      navigate('/login', { replace: true });
      return false;
    }
    return true;
  }, [checkSession, navigate]);

  // Check session on mount and set up activity listeners
  useEffect(() => {
    checkSession();

    // Update activity on user interaction
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      if (localStorage.getItem(ADMIN_TOKEN_KEY)) {
        updateActivity();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check session periodically
    const intervalId = setInterval(() => {
      if (localStorage.getItem(ADMIN_TOKEN_KEY)) {
        checkSession();
      }
    }, 60000); // Check every minute

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, [checkSession, updateActivity]);

  return {
    isValidSession,
    isChecking,
    checkSession,
    requireAdminSession,
    clearAdminSession,
    updateActivity,
  };
}
