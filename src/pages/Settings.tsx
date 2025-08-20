import { useState, useEffect } from 'react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { SideNav } from '@/components/layout/SideNav';
import authService from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Zap,
  Key,
  Wifi,
  Clock,
  TestTube,
  Sparkles,
  TrendingUp,
  FileText,
  AlertTriangle,
  BarChart,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useRealTime } from '@/contexts/RealTimeContext';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [userRole] = useState<'admin' | 'user' | 'store_manager'>(
    currentUser?.role || 'user'
  );

  // Redirect non-admin users
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      toast.error('Access denied. Only administrators can access settings.');
      navigate('/');
    }
  }, [currentUser, navigate]);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoReports, setAutoReports] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastAIGeneration, setLastAIGeneration] = useState<string | null>(() =>
    localStorage.getItem('last_ai_generation')
  );
  const [autoGenerateAI, setAutoGenerateAI] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState(
    () => localStorage.getItem('openai_api_key') || ''
  );
  const [showApiKey, setShowApiKey] = useState(false);

  const {
    config,
    updateConfig,
    toggleAutoRefresh,
    testConnection,
    isRefreshing,
    refreshData,
  } = useRealTime();

  // Initialize with the provided API key
  const [localApiKey, setLocalApiKey] = useState<string>(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    // Use the provided key if no key is saved
    return savedKey || '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';
  });
  const [localApiEndpoint, setLocalApiEndpoint] = useState(config.apiEndpoint);

  // Auto-save the API key on component mount if not already saved
  useEffect(() => {
    if (!localStorage.getItem('openai_api_key') && localApiKey) {
      localStorage.setItem('openai_api_key', localApiKey);
      updateConfig({ apiKey: localApiKey });
      toast.success('API key configured successfully');
    }
  }, []); // Run only once on mount

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  const handleSaveApiConfig = () => {
    if (localApiKey) {
      localStorage.setItem('openai_api_key', localApiKey);
    } else {
      localStorage.removeItem('openai_api_key');
    }
    updateConfig({ apiKey: localApiKey, apiEndpoint: localApiEndpoint });
    toast.success('API configuration saved');
  };

  const handleTestConnection = async () => {
    updateConfig({
      apiKey: localApiKey,
      apiEndpoint: localApiEndpoint,
    });
    await testConnection();
  };

  const handleGenerateAI = async (
    type: 'insights' | 'actionPlan' | 'anomalies' | 'benchmark'
  ) => {
    setIsGenerating(true);
    try {
      // Get NPS data from localStorage
      const npsData = JSON.parse(localStorage.getItem('nps-records') || '[]');

      if (npsData.length === 0) {
        toast.error('No data available. Please upload CSV data first.');
        return;
      }

      // Prepare data for AI analysis
      const dataSlice = npsData.slice(0, 100); // Limit to 100 records for API constraints

      // Import AIService
      const { AIService } = await import('@/lib/aiService');
      const aiService = new AIService(localApiKey);

      let result;
      switch (type) {
        case 'insights':
          result = await aiService.analyzeData({
            data: dataSlice,
            analysisType: 'insights',
          });
          localStorage.setItem('ai_insights', JSON.stringify(result));
          toast.success('Insights generated successfully!');
          break;
        case 'actionPlan':
          result = await aiService.analyzeData({
            data: dataSlice,
            analysisType: 'escalation',
          });
          localStorage.setItem('ai_action_plan', JSON.stringify(result));
          toast.success('Action plan generated successfully!');
          break;
        case 'anomalies':
          // Detect anomalies using data analysis
          const { detectAnomalies } = await import('@/lib/data');
          const anomalies = detectAnomalies(npsData);
          localStorage.setItem('ai_anomalies', JSON.stringify(anomalies));
          toast.success(`Detected ${anomalies.length} anomalies!`);
          break;
        case 'benchmark':
          // Detect benchmark drops
          const { detectBenchmarkDrops } = await import('@/lib/data');
          const benchmarks = detectBenchmarkDrops(npsData);
          localStorage.setItem('ai_benchmarks', JSON.stringify(benchmarks));
          toast.success('Benchmark analysis completed!');
          break;
      }

      // Update last generation timestamp
      const timestamp = new Date().toISOString();
      setLastAIGeneration(timestamp);
      localStorage.setItem('last_ai_generation', timestamp);

      // Dispatch event to notify other components
      window.dispatchEvent(
        new CustomEvent('nps-ai-updated', {
          detail: { type, timestamp },
        })
      );
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error(`Failed to generate ${type}. Please check your API key.`);
    } finally {
      setIsGenerating(false);
    }
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

        <main className="flex-1 p-6 pr-0 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Configure your NPS intelligence portal preferences and
                integrations
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getConnectionStatusBadge()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Integration Settings */}
            <Card className="bg-card border">
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
                    onChange={e => setLocalApiEndpoint(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your NPS data source API endpoint
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-key">OpenAI API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="sk-..."
                    value={localApiKey}
                    onChange={e => setLocalApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    For production, store this in Supabase Secrets and call via
                    Edge Functions
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleTestConnection}
                    disabled={!localApiKey}
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                  <Button className="flex-1" onClick={handleSaveApiConfig}>
                    <Key className="w-4 h-4 mr-2" />
                    Save Config
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* OpenAI API Configuration */}
            <Card className="bg-card border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-green-500" />
                  OpenAI API Configuration
                  <Badge
                    variant={openaiApiKey ? 'default' : 'destructive'}
                    className="ml-auto"
                  >
                    {openaiApiKey ? 'Connected' : 'Not Connected'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="openai-key"
                        type={showApiKey ? 'text' : 'password'}
                        value={openaiApiKey}
                        onChange={e => setOpenaiApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      onClick={() => {
                        localStorage.setItem('openai_api_key', openaiApiKey);
                        toast.success('API key saved successfully');
                      }}
                      disabled={!openaiApiKey}
                    >
                      Save Key
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your OpenAI API key to enable AI-powered insights and
                    chatbot features. Get your API key from{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      className="text-primary hover:underline"
                    >
                      OpenAI Platform
                    </a>
                  </p>
                </div>

                {openaiApiKey && (
                  <div className="space-y-2">
                    <Label htmlFor="model-selection">AI Model</Label>
                    <Select
                      value={
                        localStorage.getItem('ai_model') || 'gpt-3.5-turbo'
                      }
                      onValueChange={value => {
                        localStorage.setItem('ai_model', value);
                        toast.success('Model preference saved');
                      }}
                    >
                      <SelectTrigger id="model-selection">
                        <SelectValue placeholder="Select AI Model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-3.5-turbo">
                          GPT-3.5 Turbo (Fast & Economical)
                        </SelectItem>
                        <SelectItem value="gpt-4">
                          GPT-4 (Most Capable)
                        </SelectItem>
                        <SelectItem value="gpt-4-turbo-preview">
                          GPT-4 Turbo (Latest)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-left">
                    <Label htmlFor="auto-insights">
                      Auto-Generate Insights
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically generate AI insights when data changes
                    </p>
                  </div>
                  <Switch
                    id="auto-insights"
                    checked={autoGenerateAI}
                    onCheckedChange={checked => {
                      setAutoGenerateAI(checked);
                      localStorage.setItem(
                        'auto_generate_ai',
                        checked.toString()
                      );
                      toast.success(
                        checked
                          ? 'Auto-insights enabled'
                          : 'Auto-insights disabled'
                      );
                    }}
                    disabled={!openaiApiKey}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Actions */}
            <Card className="bg-card border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI Intelligence Actions
                  <Badge variant="outline" className="ml-auto">
                    Powered by OpenAI
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Generate AI-powered insights from your NPS data
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center"
                    onClick={() => handleGenerateAI('insights')}
                    disabled={!localApiKey || isGenerating}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Generate Insights
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center justify-center"
                    onClick={() => handleGenerateAI('actionPlan')}
                    disabled={!localApiKey || isGenerating}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Action Plans
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center justify-center"
                    onClick={() => handleGenerateAI('anomalies')}
                    disabled={!localApiKey || isGenerating}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Detect Anomalies
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center justify-center"
                    onClick={() => handleGenerateAI('benchmark')}
                    disabled={!localApiKey || isGenerating}
                  >
                    <BarChart className="w-4 h-4 mr-2" />
                    Benchmark Analysis
                  </Button>
                </div>

                {lastAIGeneration && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Last generated:{' '}
                      {new Date(lastAIGeneration).toLocaleString()}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <Label>Auto-generate on data changes</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically run AI analysis when data updates
                    </p>
                  </div>
                  <Switch
                    checked={autoGenerateAI}
                    onCheckedChange={setAutoGenerateAI}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-card border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <Label htmlFor="email-notifications">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates for critical alerts
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <Label htmlFor="alerts-enabled">Real-time Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Show instant alerts for NPS changes
                    </p>
                  </div>
                  <Switch
                    id="alerts-enabled"
                    checked={alertsEnabled}
                    onCheckedChange={setAlertsEnabled}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <Label htmlFor="auto-reports">Automatic Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Generate weekly summary reports
                    </p>
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
            <Card className="bg-card border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value="admin@reliancetrends.com"
                    readOnly
                  />
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
            <Card className="bg-card border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upload-frequency">Upload Frequency</Label>
                  <Input
                    id="upload-frequency"
                    value="Real-time via API"
                    readOnly
                  />
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
            <Card className="bg-card border">
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
                  <Input
                    id="from-email"
                    value="nps-alerts@reliancetrends.com"
                  />
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
            <Button variant="outline">Reset to Defaults</Button>
            <Button variant="outline">Export Configuration</Button>
          </div>
        </main>
      </div>
    </div>
  );
}
