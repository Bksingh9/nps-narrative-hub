import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CSVDataSyncProps {
  onDataLoaded?: (data: any[], metadata: any) => void;
}

export function CSVDataSync({ onDataLoaded }: CSVDataSyncProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);

  // Load data from backend on mount and when filters change
  const loadDataFromBackend = async (filters: any = {}) => {
    try {
      setIsLoading(true);
      
      // Check if data exists on backend
      const statusResponse = await fetch('http://localhost:3001/api/crawler/csv/current-data');
      const statusResult = await statusResponse.json();
      
      if (statusResult.success && statusResult.hasData) {
        // Fetch filtered data
        const dataResponse = await fetch('http://localhost:3001/api/crawler/csv/filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters })
        });
        
        const dataResult = await dataResponse.json();
        
        if (dataResult.success && dataResult.data) {
          // Store in localStorage for other components
          localStorage.setItem('nps-records', JSON.stringify(dataResult.data));
          
          // Dispatch event to update UI
          window.dispatchEvent(new CustomEvent('nps-data-updated', { 
            detail: { 
              records: dataResult.data.length,
              aggregates: dataResult.aggregates 
            } 
          }));
          
          setHasData(true);
          
          if (onDataLoaded) {
            onDataLoaded(dataResult.data, dataResult.aggregates);
          }
          
          console.log(`Loaded ${dataResult.data.length} records from backend`);
          return true;
        }
      }
      
      setHasData(false);
      return false;
    } catch (error) {
      console.error('Error loading data from backend:', error);
      setHasData(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to backend data
  const applyFilters = async (filters: {
    dateFrom?: string;
    dateTo?: string;
    state?: string;
    storeCode?: string;
    region?: string;
  }) => {
    console.log('Applying filters:', filters);
    await loadDataFromBackend(filters);
  };

  // Initial load
  useEffect(() => {
    loadDataFromBackend();
    
    // Set up periodic sync (every 30 seconds)
    const interval = setInterval(() => {
      loadDataFromBackend();
    }, 30000);
    
    // Listen for filter changes
    const handleFilterChange = (event: CustomEvent) => {
      applyFilters(event.detail);
    };
    
    window.addEventListener('apply-filters' as any, handleFilterChange as any);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('apply-filters' as any, handleFilterChange as any);
    };
  }, []);

  // Expose methods globally
  useEffect(() => {
    (window as any).csvDataSync = {
      refresh: () => loadDataFromBackend(),
      applyFilters: (filters: any) => applyFilters(filters),
      hasData: () => hasData,
      isLoading: () => isLoading
    };
  }, [hasData, isLoading]);

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 flex items-center gap-2 z-50">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm">Syncing data...</span>
      </div>
    );
  }

  if (hasData) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-50 shadow-lg rounded-lg p-3 flex items-center gap-2 z-50 opacity-0 animate-fade-out">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-green-700">Data synced</span>
      </div>
    );
  }

  return null;
}

export default CSVDataSync; 