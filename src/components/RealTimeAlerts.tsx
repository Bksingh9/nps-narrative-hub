import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  TrendingDown, 
  Users, 
  Store, 
  X,
  Bell,
  ChevronRight 
} from 'lucide-react';
import openaiService from '@/services/openaiService';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  location?: string;
  timestamp: Date;
  actionable: boolean;
}

interface RealTimeAlertsProps {
  compact?: boolean;
  maxAlerts?: number;
}

export function RealTimeAlerts({ compact = false, maxAlerts = 5 }: RealTimeAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('dismissed_alerts') || '[]'))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const { filteredData } = useData();

  useEffect(() => {
    generateAlerts(filteredData);
    // Also regenerate when data is updated elsewhere
    const handleDataUpdate = () => generateAlerts(filteredData);
    window.addEventListener('nps-data-updated', handleDataUpdate);
    window.addEventListener('filters-applied' as any, handleDataUpdate as any);
    return () => {
      window.removeEventListener('nps-data-updated', handleDataUpdate);
      window.removeEventListener('filters-applied' as any, handleDataUpdate as any);
    };
  }, [filteredData]);

  const generateAlerts = async (sourceData: any[]) => {
    setIsGenerating(true);
    const data = Array.isArray(sourceData) ? sourceData : [];
    
    if (!data || data.length === 0) {
      setAlerts([]);
      setIsGenerating(false);
      return;
    }

    const newAlerts: Alert[] = [];
    
    // Calculate metrics
    const npsScores = data.map((d: any) => {
      const score = d.npsScore || d['NPS Score'] || 
        d['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'];
      return typeof score === 'number' ? score : parseInt(score || '0');
    }).filter((s: number) => !isNaN(s));

    const promoters = npsScores.filter((s: number) => s >= 9).length;
    const detractors = npsScores.filter((s: number) => s < 7).length;
    const npsScore = Math.round(((promoters - detractors) / npsScores.length) * 100);
    const detractorPercent = Math.round((detractors / npsScores.length) * 100);

    // Group by store for store-level alerts
    const storeGroups: { [key: string]: any[] } = {};
    data.forEach((record: any) => {
      const store = record.storeCode || record['Store Code'] || 'Unknown';
      if (!storeGroups[store]) storeGroups[store] = [];
      storeGroups[store].push(record);
    });

    // Check for critical overall NPS
    if (npsScore < 0) {
      newAlerts.push({
        id: 'overall-critical',
        type: 'critical',
        title: 'Critical NPS Score',
        description: `Overall NPS is negative at ${npsScore}. More customers are detractors than promoters.`,
        timestamp: new Date(),
        actionable: true
      });
    }

    // Check for high detractor rate
    if (detractorPercent > 40) {
      newAlerts.push({
        id: 'high-detractors',
        type: 'critical',
        title: 'High Detractor Rate',
        description: `${detractorPercent}% of customers are detractors. Immediate action required to address customer dissatisfaction.`,
        timestamp: new Date(),
        actionable: true
      });
    }

    // Check for underperforming stores
    let criticalStores = 0;
    Object.entries(storeGroups).forEach(([store, records]) => {
      const storeScores = records.map(r => {
        const score = r.npsScore || r['NPS Score'] || 
          r['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'];
        return typeof score === 'number' ? score : parseInt(score || '0');
      }).filter(s => !isNaN(s));
      
      if (storeScores.length > 0) {
        const storePromoters = storeScores.filter(s => s >= 9).length;
        const storeDetractors = storeScores.filter(s => s < 7).length;
        const storeNPS = Math.round(((storePromoters - storeDetractors) / storeScores.length) * 100);
        
        if (storeNPS < -20) {
          criticalStores++;
        }
      }
    });

    if (criticalStores > 0) {
      newAlerts.push({
        id: 'critical-stores',
        type: 'warning',
        title: 'Stores Need Attention',
        description: `${criticalStores} store${criticalStores > 1 ? 's have' : ' has'} critically low NPS scores (below -20).`,
        timestamp: new Date(),
        actionable: true
      });
    }

    // Check for recent decline based on last 7 days within filtered set
    const recentData = data.filter((d: any) => {
      const date = new Date(d.responseDate || d['Response Date']);
      const daysDiff = (new Date().getTime() - date.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 7;
    });

    let recentNPS = npsScore; // Default to current NPS if no recent data
    if (recentData.length > 10) {
      const recentScores = recentData.map((d: any) => {
        const score = d.npsScore || d['NPS Score'] || 
          d['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'];
        return typeof score === 'number' ? score : parseInt(score || '0');
      }).filter((s: number) => !isNaN(s));
      
      const recentPromoters = recentScores.filter((s: number) => s >= 9).length;
      const recentDetractors = recentScores.filter((s: number) => s < 7).length;
      recentNPS = Math.round(((recentPromoters - recentDetractors) / recentScores.length) * 100);
      
      if (recentNPS < npsScore - 10) {
        newAlerts.push({
          id: 'declining-trend',
          type: 'warning',
          title: 'Declining NPS Trend',
          description: `Recent NPS (${recentNPS}) is significantly lower than overall (${npsScore}). Investigation recommended.`,
          timestamp: new Date(),
          actionable: true
        });
      }
    }

    // Low response rate alert
    const uniqueStores = [...new Set(data.map((d: any) => d.storeCode || d['Store Code']))].length;
    const avgResponsesPerStore = data.length / Math.max(uniqueStores, 1);
    if (avgResponsesPerStore < 5) {
      newAlerts.push({
        id: 'low-responses',
        type: 'info',
        title: 'Low Response Rate',
        description: `Average of ${avgResponsesPerStore.toFixed(1)} responses per store. Consider improving survey distribution.`,
        timestamp: new Date(),
        actionable: false
      });
    }

    // Optional: AI-generated alerts (best effort)
    try {
      const aiAlerts = await openaiService.generateRealTimeAlerts({
        npsScore,
        detractorPercent,
        stores: Object.keys(storeGroups).map(store => ({
          store,
          nps: calculateStoreNPS(storeGroups[store])
        })),
        trend: recentData.length > 0 ? 
          (recentNPS - npsScore) : 0,
        responseRate: avgResponsesPerStore
      });
      
      aiAlerts.forEach((alert, index) => {
        newAlerts.push({
          id: `ai-${index}`,
          type: 'warning',
          title: 'AI Insight',
          description: alert,
          timestamp: new Date(),
          actionable: true
        });
      });
    } catch (error) {
      // ignore AI failures
    }

    // Filter out dismissed alerts
    const filteredAlerts = newAlerts.filter(alert => !dismissedAlerts.has(alert.id));
    setAlerts(filteredAlerts.slice(0, maxAlerts));
    setIsGenerating(false);
  };

  const calculateStoreNPS = (records: any[]): number => {
    const scores = records.map(r => {
      const score = r.npsScore || r['NPS Score'] || 
        r['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'];
    return typeof score === 'number' ? score : parseInt(score || '0');
    }).filter(s => !isNaN(s));
    
    if (scores.length === 0) return 0;
    
    const promoters = scores.filter(s => s >= 9).length;
    const detractors = scores.filter(s => s < 7).length;
    return Math.round(((promoters - detractors) / scores.length) * 100);
  };

  const dismissAlert = (alertId: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(alertId);
    setDismissedAlerts(newDismissed);
    localStorage.setItem('dismissed_alerts', JSON.stringify(Array.from(newDismissed)));
    setAlerts(alerts.filter(a => a.id !== alertId));
    toast.success('Alert dismissed');
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <TrendingDown className="h-4 w-4" />;
      case 'info':
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
      default:
        return 'outline';
    }
  };

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-900/10 dark:to-orange-900/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Active Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active alerts</p>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-start gap-2">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alert.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {alert.description}
                    </p>
                  </div>
                </div>
              ))}
              {alerts.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full">
                  View all {alerts.length} alerts
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Real-Time Alerts & Concerns
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {alerts.length} Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2" />
              <p>No active alerts</p>
              <p className="text-sm">System is operating normally</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50"
                >
                  <div className={`mt-0.5 ${
                    alert.type === 'critical' ? 'text-red-500' :
                    alert.type === 'warning' ? 'text-orange-500' :
                    'text-blue-500'
                  }`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <Badge variant={getAlertColor(alert.type)} className="text-xs">
                        {alert.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alert.description}
                    </p>
                    {alert.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {alert.location}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {alert.actionable && (
                        <Button size="sm" variant="outline">
                          Take Action
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Dismiss
                      </Button>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 