import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bug, RefreshCw, Database } from "lucide-react";
import { toast } from "sonner";

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>({
    recordCount: 0,
    hasData: false,
    apiKey: false,
    lastUpdate: null
  });

  const loadDebugInfo = () => {
    try {
      const records = JSON.parse(localStorage.getItem('nps-records') || '[]');
      const apiKey = localStorage.getItem('openai_api_key');
      
      setDebugInfo({
        recordCount: records.length,
        hasData: records.length > 0,
        apiKey: !!apiKey,
        lastUpdate: new Date().toLocaleTimeString(),
        columns: records.length > 0 ? Object.keys(records[0]) : []
      });
    } catch (error) {
      console.error('Debug loading error:', error);
      setDebugInfo({
        recordCount: 0,
        hasData: false,
        apiKey: false,
        lastUpdate: null,
        error: error.message
      });
    }
  };

  useEffect(() => {
    loadDebugInfo();
    
    // Listen for data updates
    const handleDataUpdate = () => {
      loadDebugInfo();
    };
    
    window.addEventListener('nps-data-updated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('nps-data-updated', handleDataUpdate);
    };
  }, []);



  return (
    <Card className="bg-gradient-chart border-muted">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-yellow-500" />
          Debug Info
          <Badge variant="outline" className="ml-auto">Dev Mode</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Records in Storage:</span>
          <Badge variant={debugInfo.hasData ? "default" : "destructive"}>
            {debugInfo.recordCount}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">API Key:</span>
          <Badge variant={debugInfo.apiKey ? "default" : "destructive"}>
            {debugInfo.apiKey ? "Configured" : "Missing"}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Last Check:</span>
          <span className="text-xs text-muted-foreground">
            {debugInfo.lastUpdate || "Never"}
          </span>
        </div>

        {debugInfo.columns && debugInfo.columns.length > 0 && (
          <div>
            <span className="text-sm">Detected Columns ({debugInfo.columns.length}):</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {debugInfo.columns.slice(0, 5).map((col: string) => (
                <Badge key={col} variant="outline" className="text-xs">
                  {col}
                </Badge>
              ))}
              {debugInfo.columns.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{debugInfo.columns.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {debugInfo.error && (
          <div className="text-xs text-destructive">
            Error: {debugInfo.error}
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadDebugInfo}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              console.log('LocalStorage data:', {
                records: JSON.parse(localStorage.getItem('nps-records') || '[]'),
                history: JSON.parse(localStorage.getItem('nps-upload-history') || '[]'),
                filters: JSON.parse(localStorage.getItem('nps-filters') || '{}'),
                apiKey: !!localStorage.getItem('openai_api_key')
              });
              alert('Check browser console for detailed data');
            }}
          >
            <Database className="w-4 h-4 mr-2" />
            Log Data
          </Button>
        </div>

      </CardContent>
    </Card>
  );
} 