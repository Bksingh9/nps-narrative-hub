import { useState } from "react";
import { 
  BarChart3, 
  Globe, 
  Building, 
  Upload, 
  AlertTriangle, 
  Settings
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SideNavProps {
  userRole: "admin" | "user" | "store_manager";
  collapsed?: boolean;
}

const navItems = [
  {
    title: "Overview",
    icon: BarChart3,
    href: "/",
    roles: ["admin", "user", "store_manager"],
  },
  {
    title: "State Analysis",
    icon: Globe,
    href: "/states",
    roles: ["admin", "user", "store_manager"],
  },
  {
    title: "Store Performance",
    icon: Building,
    href: "/stores",
    roles: ["admin", "user", "store_manager"],
  },
  {
    title: "Upload Data",
    icon: Upload,
    href: "/upload",
    roles: ["admin"], // Only admin can upload
  },
  {
    title: "Alerts",
    icon: AlertTriangle,
    href: "/alerts",
    roles: ["admin", "store_manager"], // Admin and manager can see alerts
    badge: 3,
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ["admin"], // Only admin can access settings
  },
];

export function SideNav({ userRole, collapsed = false }: SideNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <nav className={cn(
      "h-screen bg-card border-r transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-start"
        >
          <BarChart3 className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2">Navigation</span>}
        </Button>
      </div>

      <div className="flex-1 p-2 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground"
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="truncate">{item.title}</span>
                {item.badge && (
                  <Badge variant="destructive" className="ml-auto w-5 h-5 flex items-center justify-center p-0 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
            {isCollapsed && item.badge && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center p-0 text-xs">
                {item.badge}
              </Badge>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className={cn(
          "text-xs text-muted-foreground",
          isCollapsed ? "text-center" : "text-left"
        )}>
          {!isCollapsed && (
            <>
              <div className="font-medium">{userRole.replace('_', ' ').toUpperCase()}</div>
              <div>v2.1.0</div>
            </>
          )}
          {isCollapsed && <div>v2.1</div>}
        </div>
      </div>
    </nav>
  );
}