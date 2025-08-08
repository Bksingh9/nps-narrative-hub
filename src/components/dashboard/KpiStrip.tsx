import { TrendingUp, TrendingDown, Users, Building, RefreshCw, Wifi } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealTime } from "@/contexts/RealTimeContext";
import { useEffect, useState } from "react";

interface KpiData {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
  color: string;
}

// Mock function to simulate real-time data changes
const generateRandomKpiData = (): KpiData[] => {
  const baseValues = [42, 12847, 236, 38.7];
  const randomVariations = baseValues.map(base => 
    base + (Math.random() - 0.5) * (base * 0.1) // ±10% variation
  );

  return [
    {
      label: "Overall NPS",
      value: `+${Math.round(randomVariations[0])}`,
      change: `${randomVariations[0] > 42 ? '+' : ''}${(randomVariations[0] - 42).toFixed(1)}`,
      trend: randomVariations[0] > 42 ? "up" : "down",
      icon: TrendingUp,
      color: "nps-promoter",
    },
    {
      label: "Total Responses",
      value: Math.round(randomVariations[1]).toLocaleString(),
      change: `${randomVariations[1] > 12847 ? '+' : ''}${Math.round(((randomVariations[1] - 12847) / 12847) * 100)}%`,
      trend: randomVariations[1] > 12847 ? "up" : "down", 
      icon: Users,
      color: "chart-1",
    },
    {
      label: "Active Stores",
      value: Math.round(randomVariations[2]).toString(),
      change: `${randomVariations[2] > 236 ? '+' : ''}${Math.round(randomVariations[2] - 236)}`,
      trend: randomVariations[2] > 236 ? "up" : "down",
      icon: Building,
      color: "chart-2",
    },
    {
      label: "Rolling 3M Avg",
      value: `+${randomVariations[3].toFixed(1)}`,
      change: `${randomVariations[3] > 38.7 ? '+' : ''}${(randomVariations[3] - 38.7).toFixed(1)}`,
      trend: randomVariations[3] > 38.7 ? "up" : "down",
      icon: TrendingUp,
      color: "chart-3",
    },
  ];
};

export function KpiStrip() {
  const { config, isRefreshing, refreshData } = useRealTime();
  const [kpiData, setKpiData] = useState<KpiData[]>(generateRandomKpiData());

  // Update KPI data when real-time refresh occurs
  useEffect(() => {
    if (config.autoRefreshEnabled) {
      setKpiData(generateRandomKpiData());
    }
  }, [config.lastUpdated]);

  const handleManualRefresh = () => {
    setKpiData(generateRandomKpiData());
    refreshData();
  };

  const getConnectionIndicator = () => {
    switch (config.connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <Wifi className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Real-time Status Bar */}
      <div className="flex items-center justify-between bg-card/50 p-3 rounded-lg border">
        <div className="flex items-center gap-3">
          {getConnectionIndicator()}
          <span className="text-sm font-medium">
            Real-time Data {config.autoRefreshEnabled ? 'Active' : 'Paused'}
          </span>
          {config.lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Last updated: {new Date(config.lastUpdated).toLocaleTimeString?.() || ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {config.autoRefreshEnabled && (
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
              Auto-refresh: {config.refreshInterval}s
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <Card 
            key={kpi.label} 
            className="bg-gradient-chart hover:shadow-lg transition-all duration-300 animate-fade-in border-muted relative"
          >
            <CardContent className="p-6">
              {/* Real-time indicator */}
              {config.autoRefreshEnabled && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {kpi.label}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <Badge 
                      variant={kpi.trend === "up" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {kpi.trend === "up" ? "+" : ""}{kpi.change}
                    </Badge>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-${kpi.color}/10 border border-${kpi.color}/20`}>
                  <kpi.icon className={`w-6 h-6 text-${kpi.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                {kpi.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-nps-promoter" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
                <span className="text-muted-foreground">vs last period</span>
                {config.autoRefreshEnabled && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    Live
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}