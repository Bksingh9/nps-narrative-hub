import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

export interface RealTimeConfig {
  autoRefreshEnabled: boolean;
  refreshInterval: number; // in seconds
  websocketEnabled: boolean;
  apiEndpoint: string;
  apiKey: string;
  lastUpdated: Date | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
}

interface RealTimeContextType {
  config: RealTimeConfig;
  updateConfig: (updates: Partial<RealTimeConfig>) => void;
  refreshData: () => Promise<void>;
  toggleAutoRefresh: () => void;
  testConnection: () => Promise<boolean>;
  isRefreshing: boolean;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

const defaultConfig: RealTimeConfig = {
  autoRefreshEnabled: true,
  refreshInterval: 30, // 30 seconds like Looker Studio
  websocketEnabled: false,
  apiEndpoint: '',
  apiKey: '',
  lastUpdated: null,
  connectionStatus: 'disconnected'
};

export function RealTimeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RealTimeConfig>(() => {
    // Load from localStorage if available and revive Date fields
    const saved = localStorage.getItem('realtime-config');
    if (!saved) return defaultConfig;
    const parsed = JSON.parse(saved);
    const revived = {
      ...parsed,
      lastUpdated: parsed?.lastUpdated ? new Date(parsed.lastUpdated) : null,
    } as Partial<RealTimeConfig>;
    return { ...defaultConfig, ...revived } as RealTimeConfig;
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  // Save to localStorage whenever config changes
  useEffect(() => {
    localStorage.setItem('realtime-config', JSON.stringify(config));
  }, [config]);

  // Auto-refresh functionality
  useEffect(() => {
    if (config.autoRefreshEnabled && config.refreshInterval > 0) {
      const timer = setInterval(() => {
        refreshData();
      }, config.refreshInterval * 1000);
      
      setRefreshTimer(timer);
      return () => clearInterval(timer);
    } else if (refreshTimer) {
      clearInterval(refreshTimer);
      setRefreshTimer(null);
    }
  }, [config.autoRefreshEnabled, config.refreshInterval]);

  const updateConfig = (updates: Partial<RealTimeConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const refreshData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    updateConfig({ connectionStatus: 'connecting' });
    
    try {
      // Simulate API call - replace with actual data fetching
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateConfig({ 
        lastUpdated: new Date(),
        connectionStatus: 'connected'
      });
      
      toast.success('Data refreshed successfully', {
        description: `Updated at ${new Date().toLocaleTimeString()}`
      });
      
    } catch (error) {
      updateConfig({ connectionStatus: 'error' });
      toast.error('Failed to refresh data', {
        description: 'Check your API configuration'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleAutoRefresh = () => {
    updateConfig({ autoRefreshEnabled: !config.autoRefreshEnabled });
    
    if (!config.autoRefreshEnabled) {
      toast.success('Auto-refresh enabled', {
        description: `Refreshing every ${config.refreshInterval} seconds`
      });
    } else {
      toast.info('Auto-refresh disabled');
    }
  };

  const testConnection = async (): Promise<boolean> => {
    if (!config.apiEndpoint || !config.apiKey) {
      toast.error('API configuration required', {
        description: 'Please configure your API endpoint and key'
      });
      return false;
    }

    updateConfig({ connectionStatus: 'connecting' });
    
    try {
      // Simulate API test - replace with actual test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      updateConfig({ connectionStatus: 'connected' });
      toast.success('Connection successful', {
        description: 'API endpoint is responding'
      });
      return true;
      
    } catch (error) {
      updateConfig({ connectionStatus: 'error' });
      toast.error('Connection failed', {
        description: 'Unable to connect to API endpoint'
      });
      return false;
    }
  };

  return (
    <RealTimeContext.Provider
      value={{
        config,
        updateConfig,
        refreshData,
        toggleAutoRefresh,
        testConnection,
        isRefreshing
      }}
    >
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime() {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
} 