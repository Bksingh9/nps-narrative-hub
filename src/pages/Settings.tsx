import { useState } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { SideNav } from "@/components/layout/SideNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Globe, 
  RefreshCw, 
  Zap, 
  Key, 
  Wifi,
  Clock,
  TestTube
} from "lucide-react";
import { useRealTime } from "@/contexts/RealTimeContext";
import { toast } from "sonner";

export default function Settings() {
  const [userRole] = useState<"admin" | "user" | "store_manager">("admin");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoReports, setAutoReports] = useState(false);
  
  const { 
    config, 
    updateConfig, 
    toggleAutoRefresh, 
    testConnection, 
    isRefreshing,
    refreshData 
  } = useRealTime();

  const [localApiKey, setLocalApiKey] = useState(config.apiKey);
  const [localApiEndpoint, setLocalApiEndpoint] = useState(config.apiEndpoint);

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const handleSaveApiConfig = () => {
    updateConfig({
      apiKey: localApiKey,
      apiEndpoint: localApiEndpoint
    });
    toast.success("API configuration saved");
  };

  const handleTestConnection = async () => {
    updateConfig({
      apiKey: localApiKey,
      apiEndpoint: localApiEndpoint
    });
    await testConnection();
  };

  const getConnectionStatusBadge = () => {
    switch (config.connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-500">Connected</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500">Connecting...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar userRole={userRole} onLogout={handleLogout} />
      
      <div className="flex">
        <SideNav userRole={userRole} />
        
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Configure your NPS intelligence portal preferences and integrations
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getConnectionStatusBadge()}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-Time Data Settings */}
            <Card className="bg-gradient-chart border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Real-Time Updates
                  <Badge variant="outline" className="ml-auto">Looker Studio Style</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-refresh">Auto-Refresh Data</Label>
                    <p className="text-sm text-muted-foreground">Automatically update data like Looker Studio</p>
                  </div>
                  <Switch 
                    id="auto-refresh"
                    checked={config.autoRefreshEnabled}
                    onCheckedChange={toggleAutoRefresh}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="refresh-interval">Refresh Interval</Label>
                  <Select 
                    value={config.refreshInterval.toString()} 
                    onValueChange={(value) => updateConfig({ refreshInterval: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="900">15 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {config.lastUpdated && `Last updated: ${config.lastUpdated.toLocaleTimeString()}`}
                  </p>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="websocket">WebSocket Connection</Label>
                    <p className="text-sm text-muted-foreground">Enable real-time push updates</p>
                  </div>
                  <Switch 
                    id="websocket"
                    checked={config.websocketEnabled}
                    onCheckedChange={(checked) => updateConfig({ websocketEnabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* API Integration Settings */}
            <Card className="bg-gradient-chart border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-500" />
                  API Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">API Endpoint URL</Label>
                  <Input 
                    id="api-endpoint" 
                    placeholder="https://api.yourservice.com/nps"
                    value={localApiEndpoint}
                    onChange={(e) => setLocalApiEndpoint(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your NPS data source API endpoint
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input 
                    id="api-key" 
                    type="password"
                    placeholder="Enter your API key"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep your API key secure and never share it
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleTestConnection}
                    disabled={!localApiEndpoint || !localApiKey}
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleSaveApiConfig}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Save Config
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-gradient-chart border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email updates for critical alerts</p>
                  </div>
                  <Switch 
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="alerts-enabled">Real-time Alerts</Label>
                    <p className="text-sm text-muted-foreground">Show instant alerts for NPS changes</p>
                  </div>
                  <Switch 
                    id="alerts-enabled"
                    checked={alertsEnabled}
                    onCheckedChange={setAlertsEnabled}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-reports">Automatic Reports</Label>
                    <p className="text-sm text-muted-foreground">Generate weekly summary reports</p>
                  </div>
                  <Switch 
                    id="auto-reports"
                    checked={autoReports}
                    onCheckedChange={setAutoReports}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="bg-gradient-chart border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value="admin@reliancetrends.com" readOnly />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value="System Administrator" readOnly />
                </div>
                
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
                
                <Button variant="outline" className="w-full">
                  Two-Factor Authentication
                </Button>
              </CardContent>
            </Card>

            {/* Data Sources */}
            <Card className="bg-gradient-chart border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upload-frequency">Upload Frequency</Label>
                  <Input id="upload-frequency" value="Real-time via API" readOnly />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data-retention">Data Retention</Label>
                  <Input id="data-retention" value="24 months" readOnly />
                </div>
                
                <Button variant="outline" className="w-full">
                  Configure S3 Integration
                </Button>
                
                <Button variant="outline" className="w-full">
                  View Data Pipeline Status
                </Button>
              </CardContent>
            </Card>

            {/* Email Settings */}
            <Card className="bg-gradient-chart border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">SMTP Server</Label>
                  <Input id="smtp-server" value="smtp.reliancetrends.com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input id="from-email" value="nps-alerts@reliancetrends.com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="alert-threshold">Alert Threshold</Label>
                  <Input id="alert-threshold" value="±10 NPS points" />
                </div>
                
                <Button variant="outline" className="w-full">
                  Test Email Configuration
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button>
              <SettingsIcon className="w-4 h-4 mr-2" />
              Save All Settings
            </Button>
            <Button variant="outline">
              Reset to Defaults
            </Button>
            <Button variant="outline">
              Export Configuration
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}