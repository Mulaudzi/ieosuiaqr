import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_LAST_ACTIVITY_KEY = 'admin_last_activity';
const ADMIN_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export default function AdminIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminSession = () => {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      const lastActivity = localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);

      if (!token) {
        // No token, redirect to admin login
        navigate("/admin/login", { replace: true });
        return;
      }

      // Check if session has expired
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed > ADMIN_SESSION_TIMEOUT) {
          // Session expired, clear and redirect to login
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
          navigate("/admin/login", { replace: true });
          return;
        }
      }

      // Valid session, redirect to dashboard
      navigate("/admin/dashboard", { replace: true });
    };

    checkAdminSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
