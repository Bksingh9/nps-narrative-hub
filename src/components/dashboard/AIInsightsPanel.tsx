import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, AlertTriangle, Brain, Key, Eye, EyeOff, Loader2, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFilters } from "@/contexts/FilterContext";
import { AIService } from "@/lib/aiService";
import { toast } from "sonner";

interface EscalationMetric {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  store?: string;
  state?: string;
  region?: string;
  description: string;
  aiRecommendation: string;
  timestamp: string;
}

// Function to load NPS records from localStorage
const loadNpsRecords = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('nps-records') || '[]');
  } catch {
    return [];
  }
};

export function AIInsightsPanel() {
  const { filters } = useFilters();
  const [apiKey, setApiKey] = useState(() => {
    // Load the API key from localStorage on component mount
    return localStorage.getItem('openai_api_key') || '';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnected, setIsConnected] = useState(() => !!localStorage.getItem('openai_api_key'));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [escalationMetrics, setEscalationMetrics] = useState<EscalationMetric[]>([]);
  const [npsData, setNpsData] = useState<any[]>([]);

  // Load NPS data on mount and listen for updates
  useEffect(() => {
    const loadData = () => {
      const records = loadNpsRecords();
      setNpsData(records);
    };
    
    loadData();
    
    // Listen for data updates
    const handleDataUpdate = () => {
      loadData();
    };
    
    window.addEventListener('nps-data-updated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('nps-data-updated', handleDataUpdate);
    };
  }, []);

  // Check for API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsConnected(true);
    }
  }, []);

  const filteredMetrics = escalationMetrics.filter(metric => {
    if (filters.selectedStore && metric.store && metric.store !== filters.selectedStore) return false;
    if (filters.selectedState && metric.state && metric.state !== filters.selectedState) return false;
    if (filters.selectedRegion && metric.region && metric.region !== filters.selectedRegion) return false;
    return true;
  });

  const handleSaveApiKey = () => {
    // Persist key locally. For production, store in Supabase secrets.
    localStorage.setItem('openai_api_key', apiKey);
    setIsConnected(true);
    toast.success('API key saved successfully');
  };

  const handleAnalyze = async (analysisType: 'insights' | 'escalation' | 'trends') => {
    if (!apiKey || npsData.length === 0) {
      toast.error(npsData.length === 0 ? 'No data available. Please upload CSV data first.' : 'Please configure your API key');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Apply filters to data
      let filteredData = [...npsData];
      
      if (filters.selectedStore || filters.selectedState || filters.selectedRegion || filters.dateRange.from || filters.dateRange.to) {
        filteredData = filteredData.filter(row => {
          // Date filter
          if (filters.dateRange.from || filters.dateRange.to) {
            const date = row._normalized?.responseDate || row["Response Date"] || row.Date;
            if (date) {
              const itemDate = new Date(date);
              if (filters.dateRange.from && itemDate < filters.dateRange.from) return false;
              if (filters.dateRange.to && itemDate > filters.dateRange.to) return false;
            }
          }
          
          // Store filter
          if (filters.selectedStore) {
            const store = row._normalized?.storeCode || row["Store Code"] || row.Store;
            if (store !== filters.selectedStore) return false;
          }
          
          // State filter
          if (filters.selectedState) {
            const state = row._normalized?.state || row.State;
            if (state !== filters.selectedState) return false;
          }
          
          // Region filter
          if (filters.selectedRegion) {
            const region = row._normalized?.region || row.Region;
            if (region !== filters.selectedRegion) return false;
          }
          
          return true;
        });
      }

      const aiService = new AIService(apiKey);
      const result = await aiService.analyzeData({
        data: filteredData.slice(0, 100), // Limit data for API constraints
        analysisType,
        filters
      });

      if (result.success && result.analysis) {
        setAiInsights(result.analysis);
        
        // For escalation analysis, also generate metrics
        if (analysisType === 'escalation') {
          const metrics = await aiService.generateEscalationMetrics(filteredData.slice(0, 100), filters);
          setEscalationMetrics(metrics);
        }
        
        toast.success(`${analysisType} analysis completed`);
      } else {
        toast.error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze data');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <TrendingUp className="w-4 h-4" />;
      case 'medium': return <Brain className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            AI Integration Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="apiKey">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSaveApiKey}
                    disabled={!apiKey.trim() || isAnalyzing}
                  >
                    {isAnalyzing ? "Connecting..." : "Connect"}
                  </Button>
                </div>
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  For production, store your key securely in Supabase Edge Function Secrets. Frontend storage is for development only.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">AI Analysis Connected</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsConnected(false);
                  setApiKey('');
                  localStorage.removeItem('openai_api_key');
                }}
              >
                Disconnect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escalation Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Critical Issues & Escalations
            <Badge variant="destructive" className="ml-2">
              {filteredMetrics.filter(m => m.severity === 'critical').length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Connect your AI API to enable intelligent escalation analysis</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(metric.severity)}
                      <h4 className="font-semibold">{metric.title}</h4>
                      <Badge variant={getSeverityColor(metric.severity) as any}>
                        {metric.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {metric.timestamp}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Store:</span>
                      <p className="font-medium">{metric.store}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">State:</span>
                      <p className="font-medium">{metric.state}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Region:</span>
                      <p className="font-medium">{metric.region}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm">{metric.description}</p>
                    <div className="bg-muted/50 p-3 rounded border-l-4 border-l-primary">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">AI Recommendation:</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{metric.aiRecommendation}</p>
                    </div>
                  </div>
                </div>
              ))}

              {filteredMetrics.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No critical issues found for the selected filters</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}