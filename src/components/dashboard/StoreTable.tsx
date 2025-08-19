import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, TrendingUp, TrendingDown } from "lucide-react";
import { useData } from "@/contexts/DataContext";

interface StoreTableProps {
  userRole?: 'admin' | 'user' | 'store_manager';
}

export function StoreTable({ userRole }: StoreTableProps) {
  // Use DataContext for data
  const { filteredData, isLoading } = useData();

  // Calculate store metrics from filtered data
  const storeMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return [];
    }

    // Group data by store
    const storeMap = new Map<string, {
      storeName: string;
      state: string;
      city: string;
      scores: number[];
      responses: number;
    }>();

    filteredData.forEach(record => {
      const storeCode = record.storeCode || record['Store Code'] || record['Store No'] || 'Unknown';
      const storeName = record.storeName || record['Store Name'] || record['Description'] || storeCode;
      const state = record.state || record['State'] || 'Unknown';
      const city = record.city || record['City'] || 'Unknown';
      
      if (!storeMap.has(storeCode)) {
        storeMap.set(storeCode, {
          storeName,
          state,
          city,
          scores: [],
          responses: 0
        });
      }
      
      const store = storeMap.get(storeCode);
      if (!store) return;
      
      const score = record.npsScore || 
                   record['NPS Score'] || 
                   record['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'];
      
      const numScore = typeof score === 'number' ? score : parseFloat(score || '0');
      if (!isNaN(numScore)) {
        store.scores.push(numScore);
        store.responses++;
      }
    });

    // Calculate NPS for each store
    const stores = Array.from(storeMap.entries()).map(([storeCode, data]) => {
      const promoters = data.scores.filter(s => s >= 9).length;
      const detractors = data.scores.filter(s => s <= 6).length;
      const nps = data.scores.length > 0
        ? Math.round(((promoters - detractors) / data.scores.length) * 100)
        : 0;
      
      return {
        storeCode,
        storeName: data.storeName,
        state: data.state,
        city: data.city,
        nps,
        responses: data.responses,
        trend: nps > 0 ? 'up' as const : nps < 0 ? 'down' as const : 'neutral' as const
      };
    });

    // Sort by NPS score (descending)
    return stores.sort((a, b) => b.nps - a.nps).slice(0, 5); // Top 5 stores
  }, [filteredData]);

  if (isLoading) {
    return (
      <Card className="bg-gradient-chart">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Top Performing Stores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading store data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-chart hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Top Performing Stores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {storeMetrics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No store data available
          </div>
        ) : (
          <div className="space-y-3">
            {storeMetrics.map((store, index) => (
              <div 
                key={store.storeCode}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">{store.storeName}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {store.city}, {store.state}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-bold">
                        {store.nps >= 0 ? '+' : ''}{store.nps}
                      </span>
                      {store.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : store.trend === 'down' ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {store.responses} responses
                    </div>
                  </div>
                  {userRole === 'admin' && (
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}