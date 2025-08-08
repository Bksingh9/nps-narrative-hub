import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Key, AlertTriangle, TrendingUp, Eye, EyeOff } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";

interface EscalationMetric {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  store: string;
  state: string;
  region: string;
  description: string;
  aiRecommendation: string;
  timestamp: string;
}

export function AIInsightsPanel() {
  const { filters } = useFilters();
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnected, setIsConnected] = useState(() => !!localStorage.getItem('openai_api_key'));
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock escalation metrics - would be fetched from API in real implementation
  const escalationMetrics: EscalationMetric[] = [
    {
      id: '1',
      title: 'Critical NPS Drop',
      severity: 'critical',
      store: 'Downtown Mumbai',
      state: 'Maharashtra',
      region: 'West India',
      description: 'NPS dropped by 15 points in the last 7 days',
      aiRecommendation: 'Immediate staff retraining required. Customer complaints show pattern in service quality.',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      title: 'Product Availability Issues',
      severity: 'high',
      store: 'Tech Park Bangalore',
      state: 'Karnataka',
      region: 'South India',
      description: 'Multiple out-of-stock complaints affecting customer satisfaction',
      aiRecommendation: 'Optimize inventory management and supplier relationships for key products.',
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      title: 'Regional Performance Decline',
      severity: 'medium',
      store: 'All Stores',
      state: 'Tamil Nadu',
      region: 'South India',
      description: 'Overall regional performance trending downward',
      aiRecommendation: 'Conduct regional analysis and implement best practices from high-performing regions.',
      timestamp: '1 day ago'
    }
  ];

  const filteredMetrics = escalationMetrics.filter(metric => {
    if (filters.selectedStore && metric.store !== filters.selectedStore && metric.store !== 'All Stores') return false;
    if (filters.selectedState && metric.state !== filters.selectedState) return false;
    if (filters.selectedRegion && metric.region !== filters.selectedRegion) return false;
    return true;
  });

  const handleConnectAPI = async () => {
    if (!apiKey.trim()) return;
    try {
      // Persist key locally (frontend-only). For production, move to Supabase secrets.
      localStorage.setItem('openai_api_key', apiKey.trim());
      setIsAnalyzing(true);
      // lightweight test call via aiService fallback path happens elsewhere; here we just mark connected
      setTimeout(() => {
        setIsConnected(true);
        setIsAnalyzing(false);
      }, 600);
    } catch {
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
                    onClick={handleConnectAPI}
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