import {
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  RefreshCw,
  Wifi,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealTime } from '@/contexts/RealTimeContext';
import { useData } from '@/contexts/DataContext';
import { useMemo } from 'react';

interface KpiData {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
}

export function KpiStrip() {
  const { config, isRefreshing, refreshData } = useRealTime();

  // Use DataContext for data
  const {
    filteredData,
    aggregates,
    isLoading,
    refreshData: refreshDataContext,
  } = useData();

  // Calculate KPI data based on aggregates from DataContext
  const kpiData = useMemo(() => {
    if (!aggregates || isLoading) {
      // Loading placeholders for the four KPIs
      return [
        {
          label: 'Overall NPS',
          value: 'Loading...',
          change: '0',
          trend: 'neutral' as const,
          icon: TrendingUp,
          color: 'nps-promoter',
        },
        {
          label: 'Total Responses',
          value: 'Loading...',
          change: '0%',
          trend: 'neutral' as const,
          icon: Users,
          color: 'chart-1',
        },
        {
          label: 'Active Stores',
          value: 'Loading...',
          change: '0',
          trend: 'neutral' as const,
          icon: Building,
          color: 'chart-2',
        },
        {
          label: 'Avg Score',
          value: 'Loading...',
          change: '0.0',
          trend: 'neutral' as const,
          icon: TrendingUp,
          color: 'chart-3',
        },
      ];
    }

    // Calculate unique stores from filtered data
    const uniqueStores = new Set(
      filteredData.map(
        d => d.storeCode || d['Store Code'] || d['Store No'] || 'Unknown'
      )
    ).size;

    // Use aggregates from DataContext
    const nps = aggregates.npsScore || 0;
    const roundedNps = Math.round(nps);
    const totalResponses = aggregates.totalResponses || 0;
    const avgScore = aggregates.averageScore || 0;

    // TODO: Calculate changes when historical data is available
    const npsChange = 0;
    const responseChange = 0;
    const storeChange = 0;
    const avgChange = 0;

    // Return four KPIs including Overall NPS
    return [
      {
        label: 'Overall NPS',
        value: `${roundedNps >= 0 ? '+' : ''}${roundedNps}`,
        change: `${npsChange >= 0 ? '+' : ''}${npsChange}`,
        trend:
          npsChange > 0
            ? ('up' as const)
            : npsChange < 0
              ? ('down' as const)
              : ('neutral' as const),
        icon: TrendingUp,
        color: 'nps-promoter',
      },
      {
        label: 'Total Responses',
        value: totalResponses.toLocaleString(),
        change: `${responseChange >= 0 ? '+' : ''}${responseChange}%`,
        trend:
          responseChange > 0
            ? ('up' as const)
            : responseChange < 0
              ? ('down' as const)
              : ('neutral' as const),
        icon: Users,
        color: 'chart-1',
      },
      {
        label: 'Active Stores',
        value: uniqueStores.toString(),
        change: `${storeChange >= 0 ? '+' : ''}${storeChange}`,
        trend:
          storeChange > 0
            ? ('up' as const)
            : storeChange < 0
              ? ('down' as const)
              : ('neutral' as const),
        icon: Building,
        color: 'chart-2',
      },
      {
        label: 'Avg Score',
        value: avgScore.toFixed(1),
        change: `${avgChange >= 0 ? '+' : ''}${avgChange}`,
        trend:
          parseFloat(avgChange.toString()) > 0
            ? ('up' as const)
            : parseFloat(avgChange.toString()) < 0
              ? ('down' as const)
              : ('neutral' as const),
        icon: TrendingUp,
        color: 'chart-3',
      },
    ];
  }, [aggregates, filteredData, isLoading]);

  const handleRefresh = async () => {
    await refreshDataContext();
    if (refreshData) {
      refreshData();
    }
  };

  return (
    <div className="space-y-4">
      {/* Real-time sync status */}
      {config.autoRefreshEnabled && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-fade-in border">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">
              Real-time data sync active
            </span>
            <Badge variant="outline" className="text-xs">
              Every {config.refreshInterval}s
            </Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map(kpi => (
          <Card
            key={kpi.label}
            className="bg-card border hover:shadow-lg transition-all duration-300 animate-fade-in relative"
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
                      variant={kpi.trend === 'up' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {kpi.trend === 'up' ? '+' : ''}
                      {kpi.change}
                    </Badge>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-lg bg-${kpi.color}/10 border border-${kpi.color}/20`}
                >
                  <kpi.icon className={`w-6 h-6 text-${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
