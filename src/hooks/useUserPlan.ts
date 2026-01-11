import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type UserPlan = "free" | "pro" | "enterprise";

interface PlanLimits {
  maxQRCodes: number;
  hasTracking: boolean;
  hasAdvancedAnalytics: boolean;
  hasPremiumTypes: boolean;
  hasCustomBranding: boolean;
}

const planLimits: Record<UserPlan, PlanLimits> = {
  free: {
    maxQRCodes: 5,
    hasTracking: false,
    hasAdvancedAnalytics: false,
    hasPremiumTypes: false,
    hasCustomBranding: false,
  },
  pro: {
    maxQRCodes: 50,
    hasTracking: true,
    hasAdvancedAnalytics: false,
    hasPremiumTypes: true,
    hasCustomBranding: true,
  },
  enterprise: {
    maxQRCodes: Infinity,
    hasTracking: true,
    hasAdvancedAnalytics: true,
    hasPremiumTypes: true,
    hasCustomBranding: true,
  },
};

export function useUserPlan() {
  const { user, refreshUser } = useAuth();
  const [plan, setPlan] = useState<UserPlan>("free");

  // Sync plan from user context
  useEffect(() => {
    if (user?.plan) {
      // Handle both string and Plan object types
      const planValue = typeof user.plan === 'string' ? user.plan : user.plan.name;
      const userPlan = planValue.toLowerCase() as UserPlan;
      if (["free", "pro", "enterprise"].includes(userPlan)) {
        setPlan(userPlan);
        localStorage.setItem("userPlan", userPlan);
      }
    } else {
      // Fallback to localStorage
      const storedPlan = localStorage.getItem("userPlan") as UserPlan | null;
      if (storedPlan && ["free", "pro", "enterprise"].includes(storedPlan)) {
        setPlan(storedPlan);
      }
    }
  }, [user?.plan]);

  const updatePlan = useCallback((newPlan: UserPlan) => {
    localStorage.setItem("userPlan", newPlan);
    setPlan(newPlan);
  }, []);

  // Refresh user data to get updated plan (after upgrade)
  const refreshPlan = useCallback(async () => {
    try {
      await refreshUser();
    } catch {
      // Error handled by refreshUser
    }
  }, [refreshUser]);

  const limits = planLimits[plan];

  const canUsePremiumTypes = limits.hasPremiumTypes;
  const canUseTracking = limits.hasTracking;
  const canUseAdvancedAnalytics = limits.hasAdvancedAnalytics;
  const canUseCustomBranding = limits.hasCustomBranding;

  return {
    plan,
    limits,
    updatePlan,
    refreshPlan,
    canUsePremiumTypes,
    canUseTracking,
    canUseAdvancedAnalytics,
    canUseCustomBranding,
    isPro: plan === "pro" || plan === "enterprise",
    isEnterprise: plan === "enterprise",
  };
}
