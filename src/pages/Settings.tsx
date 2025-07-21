import { useState } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { SideNav } from "@/components/layout/SideNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Bell, Shield, Database, Mail, Globe } from "lucide-react";

export default function Settings() {
  const [userRole] = useState<"admin" | "user" | "store_manager">("admin");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoReports, setAutoReports] = useState(false);

  const handleLogout = () => {
    console.log("Logout clicked");
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
                Configure your NPS intelligence portal preferences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <Input id="upload-frequency" value="Daily at 2:00 AM" readOnly />
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
              Save Settings
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