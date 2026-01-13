import { useMemo } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  minScore?: number;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Contains uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Contains a number", test: (p) => /\d/.test(p) },
  { label: "Contains special character", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function PasswordStrengthIndicator({ password, minScore = 3 }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    
    const passed = requirements.filter((req) => req.test(password)).length;
    
    if (passed <= 1) return { score: 1, label: "Weak", color: "bg-destructive" };
    if (passed === 2) return { score: 2, label: "Fair", color: "bg-orange-500" };
    if (passed === 3) return { score: 3, label: "Good", color: "bg-yellow-500" };
    if (passed === 4) return { score: 4, label: "Strong", color: "bg-green-500" };
    return { score: 5, label: "Very Strong", color: "bg-green-600" };
  }, [password]);

  const passedRequirements = useMemo(() => {
    return requirements.map((req) => ({
      ...req,
      passed: req.test(password),
    }));
  }, [password]);

  if (!password) return null;

  const isStrong = strength.score >= minScore;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Password strength</span>
          <span className={cn(
            "text-xs font-medium flex items-center gap-1",
            strength.score <= 1 && "text-destructive",
            strength.score === 2 && "text-orange-500",
            strength.score === 3 && "text-yellow-500",
            strength.score >= 4 && "text-green-500"
          )}>
            {isStrong ? (
              <Check className="w-3 h-3" />
            ) : strength.score >= 2 ? (
              <AlertTriangle className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                level <= strength.score ? strength.color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements List */}
      <ul className="space-y-1">
        {passedRequirements.map((req) => (
          <li
            key={req.label}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              req.passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {req.passed ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Helper function to get password score (for validation)
export function getPasswordScore(password: string): number {
  if (!password) return 0;
  return requirements.filter((req) => req.test(password)).length;
}
