import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const ADMIN_ROUTES: Record<string, { label: string; parent?: string }> = {
  "/admin/dashboard": { label: "Dashboard" },
  "/admin/emails": { label: "Email Management", parent: "/admin/dashboard" },
  "/admin/users": { label: "Admin Users", parent: "/admin/dashboard" },
  "/admin/settings": { label: "Settings", parent: "/admin/dashboard" },
  "/admin/stats": { label: "Statistics", parent: "/admin/dashboard" },
  "/admin/audit": { label: "Audit Log", parent: "/admin/dashboard" },
  "/admin/qa": { label: "QA Console", parent: "/admin/dashboard" },
  "/admin/create": { label: "Create Admin", parent: "/admin/users" },
};

export function AdminBreadcrumb() {
  const location = useLocation();
  const currentPath = location.pathname;

  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    let path = currentPath;

    // Build breadcrumb chain by following parent references
    while (path && ADMIN_ROUTES[path]) {
      const route = ADMIN_ROUTES[path];
      items.unshift({ label: route.label, href: path });
      path = route.parent || "";
    }

    // Remove href from the last item (current page)
    if (items.length > 0) {
      delete items[items.length - 1].href;
    }

    return items;
  };

  const breadcrumbs = buildBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs on dashboard
  }

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/admin/dashboard" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
              <span className="sr-only">Admin Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((item, index) => (
          <div key={item.label} className="flex items-center">
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="font-medium">{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
