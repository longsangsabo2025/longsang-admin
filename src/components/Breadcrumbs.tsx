/**
 * Breadcrumbs Component
 * Shows current page location in navigation hierarchy
 */

import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumbs() {
  const location = useLocation();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = location.pathname.split("/").filter(Boolean);

    const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    // Build breadcrumbs from path segments
    let currentPath = "";
    for (const path of paths) {
      currentPath += `/${path}`;

      // Convert path to readable label
      const label = path
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbs.push({
        label,
        href: currentPath,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on home page
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isHome = index === 0;

          return (
            <li key={item.href} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}

              {isLast ? (
                <span className="font-medium text-foreground">{item.label}</span>
              ) : (
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-1.5 hover:text-foreground transition-colors",
                    "text-muted-foreground"
                  )}
                >
                  {isHome && <Home className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
