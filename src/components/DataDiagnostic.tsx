import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react';

export function DataDiagnostic() {
  const [dataInfo, setDataInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  const analyzeData = () => {
    const records = JSON.parse(localStorage.getItem('nps-records') || '[]');

    if (records.length === 0) {
      setDataInfo({
        hasData: false,
        message: 'No data loaded. Please upload a CSV file.',
      });
      return;
    }

    // Get first record to analyze structure
    const firstRecord = records[0];
    const columns = Object.keys(firstRecord).filter(
      key => key !== '_normalized'
    );
    const normalizedFields = firstRecord._normalized
      ? Object.keys(firstRecord._normalized)
      : [];

    // Extract unique values
    const uniqueStores = new Set();
    const uniqueStates = new Set();
    const uniqueRegions = new Set();

    records.slice(0, 10).forEach((r: any) => {
      // Try different ways to get store
      const store = r['Store No.'] || r['Store No'] || r._normalized?.storeCode;
      const state = r['State'] || r._normalized?.state;
      const region = r['Region'] || r._normalized?.region;

      if (store) uniqueStores.add(store);
      if (state) uniqueStates.add(state);
      if (region) uniqueRegions.add(region);
    });

    setDataInfo({
      hasData: true,
      totalRecords: records.length,
      columns: columns,
      columnCount: columns.length,
      normalizedFields: normalizedFields,
      firstRecord: {
        'Store No.': firstRecord['Store No.'],
        'Store Franchise': firstRecord['Store Franchise'],
        State: firstRecord['State'],
        Region: firstRecord['Region'],
        NPS: firstRecord['NPS'],
        _normalized: firstRecord._normalized,
      },
      uniqueStores: Array.from(uniqueStores),
      uniqueStates: Array.from(uniqueStates),
      uniqueRegions: Array.from(uniqueRegions),
      rawFirstRecord: firstRecord,
    });
  };

  useEffect(() => {
    analyzeData();

    // Listen for data updates
    const handleUpdate = () => analyzeData();
    window.addEventListener('nps-data-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('nps-data-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-20 right-6 z-40"
      >
        <Database className="w-4 h-4 mr-2" />
        Data Diagnostic
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-20 right-6 w-[500px] max-h-[600px] overflow-auto z-40 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Diagnostic Tool
        </CardTitle>
        <div className="flex gap-2">
          <Button onClick={analyzeData} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setIsVisible(false)} size="sm" variant="ghost">
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {dataInfo ? (
          <>
            <div className="flex items-center gap-2">
              {dataInfo.hasData ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <span className="font-medium">
                {dataInfo.hasData
                  ? `${dataInfo.totalRecords} records loaded`
                  : dataInfo.message}
              </span>
            </div>

            {dataInfo.hasData && (
              <>
                <div>
                  <h4 className="font-medium mb-2">
                    Detected Columns ({dataInfo.columnCount}):
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {dataInfo.columns.map((col: string) => (
                      <Badge key={col} variant="outline" className="text-xs">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Stores Found:</h4>
                  <div className="flex flex-wrap gap-1">
                    {dataInfo.uniqueStores.map((store: string) => (
                      <Badge
                        key={store}
                        variant="secondary"
                        className="text-xs"
                      >
                        {store}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">States Found:</h4>
                  <div className="flex flex-wrap gap-1">
                    {dataInfo.uniqueStates.map((state: string) => (
                      <Badge
                        key={state}
                        variant="secondary"
                        className="text-xs"
                      >
                        {state}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">First Record (Raw):</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(dataInfo.firstRecord, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Normalized Fields:</h4>
                  <div className="flex flex-wrap gap-1">
                    {dataInfo.normalizedFields.map((field: string) => (
                      <Badge key={field} variant="default" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Analyzing data...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
