import { 
  BarChart3, 
  Bell, 
  Sun, 
  Moon, 
  User, 
  Settings, 
  LogOut,
  Wifi,
  WifiOff,
  RefreshCw,
  CircleDot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { useRealTime } from "@/contexts/RealTimeContext";

interface HeaderBarProps {
  userRole: "admin" | "user" | "store_manager";
  onLogout: () => void;
}

export function HeaderBar({ userRole, onLogout }: HeaderBarProps) {
  const { theme, setTheme } = useTheme();
  const { config, isRefreshing, refreshData } = useRealTime();

  const getRealTimeStatusIcon = () => {
    if (isRefreshing) {
      return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
    }
    
    switch (config.connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'connecting':
        return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (isRefreshing) return "Refreshing...";
    
    switch (config.connectionStatus) {
      case 'connected':
        return config.autoRefreshEnabled ? "Live" : "Connected";
      case 'connecting':
        return "Connecting...";
      case 'error':
        return "Connection Error";
      default:
        return "Offline";
    }
  };

  const getStatusColor = () => {
    if (isRefreshing) return "bg-blue-500";
    
    switch (config.connectionStatus) {
      case 'connected':
        return config.autoRefreshEnabled ? "bg-green-500" : "bg-blue-500";
      case 'connecting':
        return "bg-yellow-500";
      case 'error':
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Reliance Trends NPS</h1>
            <p className="text-xs text-muted-foreground">Intelligence Portal</p>
          </div>
        </div>
        
        {/* Real-time Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 border">
          <div className="flex items-center gap-2">
            {getRealTimeStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${config.autoRefreshEnabled ? 'animate-pulse' : ''}`}></div>
        </div>
        
        {/* Auto-refresh indicator */}
        {config.autoRefreshEnabled && (
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
            Auto-refresh: {config.refreshInterval}s
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Manual Refresh Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refreshData}
          disabled={isRefreshing}
          className="relative"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {config.lastUpdated && (
            <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></span>
          )}
        </Button>

        {/* Theme Toggle */}
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4" />
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
          <Moon className="w-4 h-4" />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden md:inline-block">
                {userRole === "admin" ? "Administrator" : 
                 userRole === "store_manager" ? "Store Manager" : "User"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <CircleDot className="w-4 h-4 mr-2" />
              Real-time Status: {getStatusText()}
            </DropdownMenuItem>
            {config.lastUpdated && (
              <DropdownMenuItem className="text-xs text-muted-foreground">
                Last updated: {config.lastUpdated.toLocaleString()}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}