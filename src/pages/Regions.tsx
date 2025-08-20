import { useState, useEffect } from 'react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { SideNav } from '@/components/layout/SideNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, TrendingUp, TrendingDown, Building } from 'lucide-react';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { useFilters } from '@/contexts/FilterContext';
import {
  safeGetRecords,
  onNpsDataUpdated,
  extractRegion,
  extractState,
  extractStore,
  applyFilters,
  computeNps,
} from '@/lib/data';

interface RegionData {
  name: string;
  nps: number;
  totalResponses: number;
  avgScore: number;
  stores: number;
  states: string[];
  performance: number;
  status: string;
  topState?: string;
}

export default function Regions() {
  const [userRole] = useState<'admin' | 'user' | 'store_manager'>('admin');
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const { filters } = useFilters();

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  useEffect(() => {
    const loadData = () => {
      const records = safeGetRecords();
      const filteredRecords = applyFilters(records, filters);

      // Group records by region
      const regionMap = new Map<string, any[]>();
      filteredRecords.forEach(record => {
        const region = extractRegion(record);
        if (region && region !== 'Unknown') {
          if (!regionMap.has(region)) {
            regionMap.set(region, []);
          }
          regionMap.get(region)!.push(record);
        }
      });

      // Calculate metrics for each region
      const regions: RegionData[] = [];
      regionMap.forEach((records, regionName) => {
        const metrics = computeNps(records);

        // Count unique stores and states
        const uniqueStores = new Set<string>();
        const uniqueStates = new Set<string>();
        const stateCount = new Map<string, number>();

        records.forEach(r => {
          const store = extractStore(r);
          const state = extractState(r);
          if (store) uniqueStores.add(store);
          if (state) {
            uniqueStates.add(state);
            stateCount.set(state, (stateCount.get(state) || 0) + 1);
          }
        });

        // Find top state by response count
        const topState = [...stateCount.entries()].sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0];

        // Determine status based on NPS
        let status = 'unknown';
        if (metrics.nps >= 70) status = 'excellent';
        else if (metrics.nps >= 50) status = 'good';
        else if (metrics.nps >= 30) status = 'needs_attention';
        else status = 'critical';

        // Calculate performance (0-100 scale based on NPS)
        const performance = Math.max(0, Math.min(100, (metrics.nps + 100) / 2));

        regions.push({
          name: regionName,
          nps: metrics.nps,
          totalResponses: metrics.total,
          avgScore: metrics.avg,
          stores: uniqueStores.size,
          states: Array.from(uniqueStates),
          performance,
          status,
          topState,
        });
      });

      // Sort by NPS descending
      regions.sort((a, b) => b.nps - a.nps);
      setRegionData(regions);
    };

    loadData();
    const cleanup = onNpsDataUpdated(loadData);
    return cleanup;
  }, [filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-nps-promoter';
      case 'good':
        return 'text-green-600';
      case 'needs_attention':
        return 'text-nps-passive';
      case 'critical':
        return 'text-nps-detractor';
      default:
        return 'text-muted-foreground';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 80) return 'bg-nps-promoter';
    if (performance >= 60) return 'bg-green-500';
    if (performance >= 40) return 'bg-nps-passive';
    return 'bg-nps-detractor';
  };

  return (
    <div className="flex h-screen bg-background">
      <SideNav userRole={userRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderBar userRole={userRole} onLogout={handleLogout} />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Regional Overview</h1>
            <p className="text-muted-foreground">
              Performance analysis by geographical regions
            </p>
          </div>

          <FilterBar />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {regionData.length === 0 ? (
              <Card className="p-8 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No regional data available. Please upload NPS data to view
                  regional analysis.
                </p>
              </Card>
            ) : (
              regionData.map(region => (
                <Card
                  key={region.name}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {region.name} Region
                        </CardTitle>
                        {region.topState && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Leading: {region.topState}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusColor(region.status)}>
                        NPS {region.nps}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          Performance
                        </span>
                        <span className="font-semibold">
                          {region.performance}%
                        </span>
                      </div>
                      <Progress value={region.performance} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Avg Score</span>
                        <p className="text-lg font-semibold">
                          {region.avgScore}/10
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Responses</span>
                        <p className="text-lg font-semibold">
                          {region.totalResponses}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Building className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{region.stores} Stores</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {region.states.length} States
                      </Badge>
                    </div>

                    {region.states.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          States:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {region.states.slice(0, 3).map(state => (
                            <Badge
                              key={state}
                              variant="secondary"
                              className="text-xs"
                            >
                              {state}
                            </Badge>
                          ))}
                          {region.states.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{region.states.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
