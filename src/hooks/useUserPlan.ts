import { useState, useEffect } from "react";

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
  const [plan, setPlan] = useState<UserPlan>("free");

  useEffect(() => {
    const storedPlan = localStorage.getItem("userPlan") as UserPlan | null;
    if (storedPlan && ["free", "pro", "enterprise"].includes(storedPlan)) {
      setPlan(storedPlan);
    }
  }, []);

  const updatePlan = (newPlan: UserPlan) => {
    localStorage.setItem("userPlan", newPlan);
    setPlan(newPlan);
  };

  const limits = planLimits[plan];

  const canUsePremiumTypes = limits.hasPremiumTypes;
  const canUseTracking = limits.hasTracking;
  const canUseAdvancedAnalytics = limits.hasAdvancedAnalytics;
  const canUseCustomBranding = limits.hasCustomBranding;

  return {
    plan,
    limits,
    updatePlan,
    canUsePremiumTypes,
    canUseTracking,
    canUseAdvancedAnalytics,
    canUseCustomBranding,
    isPro: plan === "pro" || plan === "enterprise",
    isEnterprise: plan === "enterprise",
  };
}
