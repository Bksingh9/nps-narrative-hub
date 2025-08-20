import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Server,
  HardDrive,
} from 'lucide-react';

export default function DataDiagnostic() {
  const {
    rawData,
    filteredData,
    aggregates,
    filters,
    filterOptions,
    isLoading,
    hasData,
    lastUpdated,
    refreshData,
    loadFromLocalStorage,
  } = useData();

  const [backendStatus, setBackendStatus] = useState<
    'checking' | 'connected' | 'error'
  >('checking');
  const [backendData, setBackendData] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<any>(null);

  useEffect(() => {
    checkBackendStatus();
    checkLocalStorage();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const healthResponse = await fetch('http://localhost:3001/health');
      const healthData = await healthResponse.json();

      if (healthData.status === 'ok') {
        const dataResponse = await fetch(
          'http://localhost:3001/api/crawler/csv/current-data'
        );
        const dataResult = await dataResponse.json();
        setBackendData(dataResult);
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      console.error('Backend check failed:', error);
      setBackendStatus('error');
    }
  };

  const checkLocalStorage = () => {
    try {
      const npsRecords = localStorage.getItem('nps-records');
      const npsFilters = localStorage.getItem('nps-filters');
      const npsAggregates = localStorage.getItem('nps-aggregates');

      setLocalStorageData({
        hasRecords: !!npsRecords,
        recordCount: npsRecords ? JSON.parse(npsRecords).length : 0,
        hasFilters: !!npsFilters,
        filters: npsFilters ? JSON.parse(npsFilters) : null,
        hasAggregates: !!npsAggregates,
      });
    } catch (error) {
      console.error('LocalStorage check failed:', error);
      setLocalStorageData(null);
    }
  };

  const forceRefresh = async () => {
    await refreshData();
    await checkBackendStatus();
    checkLocalStorage();
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('nps-records');
    localStorage.removeItem('nps-filters');
    localStorage.removeItem('nps-aggregates');
    localStorage.removeItem('nps-filter-options');
    checkLocalStorage();
    window.location.reload();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Data Diagnostic Dashboard</h1>
        <Button onClick={forceRefresh} disabled={isLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Backend Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Backend Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              {backendStatus === 'connected' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : backendStatus === 'error' ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">
                {backendStatus === 'connected'
                  ? 'Connected'
                  : backendStatus === 'error'
                    ? 'Disconnected'
                    : 'Checking...'}
              </span>
            </div>

            {backendData && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Has Data:</span>
                  <Badge
                    variant={backendData.hasData ? 'default' : 'secondary'}
                  >
                    {backendData.hasData ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Records:</span>
                  <span className="font-medium">
                    {backendData.totalRecords || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium text-xs">
                    {backendData.lastUpdated
                      ? new Date(backendData.lastUpdated).toLocaleTimeString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Context Data Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Context Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              {hasData ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {hasData ? 'Data Loaded' : 'No Data'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raw Records:</span>
                <span className="font-medium">{rawData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filtered Records:</span>
                <span className="font-medium">{filteredData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Filters:</span>
                <span className="font-medium">
                  {Object.keys(filters).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">States:</span>
                <span className="font-medium">
                  {filterOptions.states.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cities:</span>
                <span className="font-medium">
                  {filterOptions.cities.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stores:</span>
                <span className="font-medium">
                  {filterOptions.stores.length}
                </span>
              </div>
            </div>

            {lastUpdated && (
              <div className="text-xs text-muted-foreground">
                Last Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* LocalStorage Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              LocalStorage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              {localStorageData?.hasRecords ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {localStorageData?.hasRecords ? 'Has Data' : 'No Data'}
              </span>
            </div>

            {localStorageData && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Records:</span>
                  <span className="font-medium">
                    {localStorageData.recordCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Has Filters:</span>
                  <Badge
                    variant={
                      localStorageData.hasFilters ? 'default' : 'secondary'
                    }
                  >
                    {localStorageData.hasFilters ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Has Aggregates:</span>
                  <Badge
                    variant={
                      localStorageData.hasAggregates ? 'default' : 'secondary'
                    }
                  >
                    {localStorageData.hasAggregates ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={loadFromLocalStorage}
              >
                Load Local
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={clearLocalStorage}
              >
                Clear Local
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Aggregates */}
      {aggregates && (
        <Card>
          <CardHeader>
            <CardTitle>Current Aggregates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">
                  {aggregates.averageScore?.toFixed(1) || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NPS Score</p>
                <p className="text-2xl font-bold">
                  {aggregates.npsScore?.toFixed(0) || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-2xl font-bold">
                  {aggregates.totalResponses || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Promoters</p>
                <p className="text-2xl font-bold text-green-600">
                  {aggregates.promoters || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters */}
      {Object.keys(filters).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => (
                <Badge key={key} variant="secondary">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Console */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Console</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(
              {
                isLoading,
                hasData,
                rawDataLength: rawData.length,
                filteredDataLength: filteredData.length,
                activeFilters: filters,
                backendStatus,
                backendHasData: backendData?.hasData,
                backendRecords: backendData?.totalRecords,
                localStorageRecords: localStorageData?.recordCount,
              },
              null,
              2
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
