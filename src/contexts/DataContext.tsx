import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { toast } from 'sonner';

interface NPSRecord {
  [key: string]: any;
  responseDate?: string;
  state?: string;
  storeCode?: string;
  storeName?: string;
  city?: string;
  region?: string;
  npsScore?: number;
  comments?: string;
}

interface Aggregates {
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
  averageScore: number;
  promoterPercent: number;
  passivePercent: number;
  detractorPercent: number;
}

interface Filters {
  dateFrom?: string;
  dateTo?: string;
  state?: string;
  city?: string;
  region?: string;
  storeCode?: string;
  storeNo?: string;
  format?: string;
  subFormat?: string;
  searchText?: string;
  npsCategory?: string;
}

interface DataContextType {
  // Data
  rawData: NPSRecord[];
  filteredData: NPSRecord[];
  aggregates: Aggregates | null;

  // Filters
  filters: Filters;
  filterOptions: {
    states: string[];
    cities: string[];
    regions: string[];
    stores: string[];
    formats: string[];
    subFormats: string[];
  };

  // Actions
  setRawData: (data: NPSRecord[]) => void;
  applyFilters: (newFilters: Filters) => Promise<void>;
  clearFilters: () => void;
  refreshData: () => Promise<void>;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;

  // State
  isLoading: boolean;
  hasData: boolean;
  lastUpdated: Date | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [rawData, setRawDataState] = useState<NPSRecord[]>([]);
  const [filteredData, setFilteredData] = useState<NPSRecord[]>([]);
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    cities: [],
    regions: [],
    stores: [],
    formats: [],
    subFormats: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Initial load on mount
  useEffect(() => {
    const initializeData = async () => {
      console.log('DataContext: Initializing data...');
      setIsLoading(true);

      try {
        // First try to load from backend
        const backendLoaded = await loadFromBackend();

        if (backendLoaded) {
          console.log('DataContext: Data loaded from backend successfully');
          // Load filter options after data is loaded
          await loadFilterOptions();
        } else {
          console.log(
            'DataContext: Backend not available, checking localStorage'
          );
          // If backend is not available, try localStorage
          let loadedLocal = false;
          try {
            // Use canonical keys saved by the app
            const storedRecords = localStorage.getItem('nps-records');
            if (storedRecords) {
              const stored: NPSRecord[] = JSON.parse(storedRecords);
              if (stored && stored.length > 0) {
                console.log(
                  'DataContext: Loaded from localStorage:',
                  stored.length,
                  'records'
                );
                setRawData(stored);
                setFilteredData(stored);
                setHasData(true);

                // Calculate aggregates for the loaded data
                const aggs = calculateAggregates(stored);
                setAggregates(aggs);

                // Apply stored filters if they exist
                const savedFilters = localStorage.getItem('nps-filters');
                if (savedFilters) {
                  await applyFiltersInternal(JSON.parse(savedFilters));
                }
                loadedLocal = true;
              }
            }
          } catch (parseError) {
            console.error(
              'DataContext: Error parsing localStorage data:',
              parseError
            );
          }
          if (!loadedLocal) {
            console.warn(
              'DataContext: No data available from backend or localStorage'
            );
          }
        }
      } catch (error) {
        console.error('DataContext: Error during initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []); // Run only once on mount

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (rawData.length > 0) {
      saveToLocalStorage();
    }
  }, [rawData, filteredData, aggregates]);

  // Save filters to localStorage
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      localStorage.setItem('nps-filters', JSON.stringify(filters));
    }
  }, [filters]);

  const loadFiltersFromLocalStorage = () => {
    try {
      const savedFilters = localStorage.getItem('nps-filters');
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters);
        setFilters(parsed);
      }
    } catch (error) {
      console.error('Error loading filters from localStorage:', error);
    }
  };

  const saveToLocalStorage = () => {
    try {
      // Save raw data
      localStorage.setItem('nps-records', JSON.stringify(rawData));

      // Save filtered data
      localStorage.setItem('nps-filtered-data', JSON.stringify(filteredData));

      // Save aggregates
      if (aggregates) {
        localStorage.setItem('nps-aggregates', JSON.stringify(aggregates));
      }

      // Save metadata
      localStorage.setItem(
        'nps-metadata',
        JSON.stringify({
          lastUpdated: lastUpdated?.toISOString(),
          totalRecords: rawData.length,
          filteredRecords: filteredData.length,
        })
      );

      console.log('Data saved to localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const loadFromLocalStorage = (): boolean => {
    try {
      const savedData = localStorage.getItem('nps-records');
      const savedFiltered = localStorage.getItem('nps-filtered-data');
      const savedAggregates = localStorage.getItem('nps-aggregates');
      const savedMetadata = localStorage.getItem('nps-metadata');

      if (savedData) {
        const data = JSON.parse(savedData);
        setRawDataState(data);
        setFilteredData(savedFiltered ? JSON.parse(savedFiltered) : data);

        if (savedAggregates) {
          setAggregates(JSON.parse(savedAggregates));
        }

        if (savedMetadata) {
          const metadata = JSON.parse(savedMetadata);
          setLastUpdated(
            metadata.lastUpdated ? new Date(metadata.lastUpdated) : new Date()
          );
        }

        setHasData(data.length > 0);
        console.log(`Loaded ${data.length} records from localStorage`);
        return true;
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return false;
  };

  const loadFromBackend = async (): Promise<boolean> => {
    try {
      console.log('DataContext: Loading data from backend...');

      // First check if backend is available
      const healthCheck = await fetch('http://localhost:3001/health');
      if (!healthCheck.ok) {
        console.log('DataContext: Backend health check failed');
        return false;
      }

      // Check current data status
      const statusResponse = await fetch(
        'http://localhost:3001/api/crawler/csv/current-data'
      );

      if (!statusResponse.ok) {
        console.log('DataContext: Failed to fetch current data status');
        return false;
      }

      const statusResult = await statusResponse.json();

      if (statusResult.success && statusResult.totalRecords > 0) {
        console.log('DataContext: Backend has data, fetching all records...');

        // Fetch all data without filters first
        const response = await fetch(
          'http://localhost:3001/api/crawler/csv/filter',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filters: {} }), // Empty filters to get all data
          }
        );

        if (!response.ok) {
          console.error('DataContext: Failed to fetch data from backend');
          return false;
        }

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          console.log(
            'DataContext: Successfully loaded',
            result.data.length,
            'records from backend'
          );

          // Set raw data
          setRawData(result.data);
          setFilteredData(result.data);
          setHasData(true);

          // Set aggregates from backend or calculate them
          if (result.aggregates) {
            console.log(
              'DataContext: Setting aggregates from backend:',
              result.aggregates
            );
            setAggregates(normalizeBackendAggregates(result.aggregates));
          } else {
            console.log('DataContext: Calculating aggregates locally');
            const aggs = calculateAggregates(result.data);
            setAggregates(aggs);
          }

          // Save to localStorage as backup
          saveToLocalStorage();

          // Load filter options
          await loadFilterOptions();

          // Apply saved filters if they exist
          const savedFilters = localStorage.getItem('nps-filters');
          if (savedFilters) {
            try {
              const filters = JSON.parse(savedFilters);
              console.log('DataContext: Applying saved filters:', filters);
              await applyFiltersInternal(filters);
            } catch (e) {
              console.error('DataContext: Error applying saved filters:', e);
            }
          }

          setLastUpdated(new Date());
          return true;
        }
      }

      console.log('DataContext: Backend has no data');
      return false;
    } catch (error) {
      console.error('DataContext: Error loading from backend:', error);
      return false;
    }
  };

  const loadFilterOptions = async () => {
    /* placeholder to satisfy TS after function additions */
    try {
      const response = await fetch(
        'http://localhost:3001/api/crawler/csv/filter-options'
      );
      const result = await response.json();

      if (result.success) {
        setFilterOptions({
          states: result.states || [],
          cities: result.cities || [],
          regions: result.regions || [],
          stores: (result.stores || []).map((s: any) =>
            typeof s === 'string' ? s : s.code
          ),
          formats: result.formats || [],
          subFormats: result.subFormats || [],
        });
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const calculateAggregates = (data: NPSRecord[]): Aggregates => {
    if (data.length === 0) {
      return {
        npsScore: 0,
        promoters: 0,
        passives: 0,
        detractors: 0,
        totalResponses: 0,
        averageScore: 0,
        promoterPercent: 0,
        passivePercent: 0,
        detractorPercent: 0,
      };
    }

    const scores = data
      .map(record => {
        const score =
          record.npsScore ||
          record['NPS Score'] ||
          record[
            'On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'
          ];
        return typeof score === 'number' ? score : parseInt(score || '0');
      })
      .filter(s => !isNaN(s));

    const promoters = scores.filter(s => s >= 9).length;
    const passives = scores.filter(s => s >= 7 && s < 9).length;
    const detractors = scores.filter(s => s < 7).length;
    const total = scores.length;

    const npsScore =
      total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
    const averageScore =
      total > 0 ? scores.reduce((a, b) => a + b, 0) / total : 0;

    return {
      npsScore,
      promoters,
      passives,
      detractors,
      totalResponses: total,
      averageScore: Math.round(averageScore * 10) / 10,
      promoterPercent: total > 0 ? Math.round((promoters / total) * 100) : 0,
      passivePercent: total > 0 ? Math.round((passives / total) * 100) : 0,
      detractorPercent: total > 0 ? Math.round((detractors / total) * 100) : 0,
    };
  };

  const normalizeBackendAggregates = (backend: any): Aggregates => {
    const total = backend.totalResponses || backend.total || 0;
    const promoters = backend.promoters || 0;
    const passives = backend.passives || 0;
    const detractors = backend.detractors || 0;
    const npsScore =
      typeof backend.npsScore === 'number' ? Math.round(backend.npsScore) : 0;
    const averageScore =
      typeof backend.averageNPS === 'number'
        ? Math.round(backend.averageNPS * 10) / 10
        : total > 0
          ? Math.round(
              ((promoters * 10 + passives * 7 + detractors * 4) / total) * 10
            ) / 10
          : 0;
    return {
      npsScore,
      promoters,
      passives,
      detractors,
      totalResponses: total,
      averageScore,
      promoterPercent: total > 0 ? Math.round((promoters / total) * 100) : 0,
      passivePercent: total > 0 ? Math.round((passives / total) * 100) : 0,
      detractorPercent: total > 0 ? Math.round((detractors / total) * 100) : 0,
    } as Aggregates;
  };

  const applyFiltersInternal = async (newFilters: Filters): Promise<void> => {
    setIsLoading(true);
    setFilters(newFilters);

    console.log('Applying filters:', newFilters);
    console.log('Total records before filtering:', rawData.length);

    try {
      // If backend is available, use it
      const response = await fetch(
        'http://localhost:3001/api/crawler/csv/filter',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters: newFilters }),
        }
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data) {
          console.log(
            'Filtered data from backend:',
            result.data.length,
            'records'
          );
          setFilteredData(result.data);
          setAggregates(
            result.aggregates
              ? normalizeBackendAggregates(result.aggregates)
              : calculateAggregates(result.data)
          );

          // Broadcast filter update
          window.dispatchEvent(
            new CustomEvent('filters-applied', {
              detail: {
                filters: newFilters,
                totalRecords: result.data.length,
                aggregates: result.aggregates,
              },
            })
          );

          // Save filters to localStorage
          localStorage.setItem('nps-filters', JSON.stringify(newFilters));
          saveToLocalStorage();
          setIsLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Backend filter error, using local filtering:', error);
    }

    // Fallback to local filtering
    let filtered = [...rawData];

    // Apply date range filter
    if (newFilters.dateFrom || newFilters.dateTo) {
      filtered = filtered.filter(record => {
        const recordDate = record.responseDate || record['Response Date'];
        if (!recordDate) return true;

        const date = new Date(recordDate);
        if (newFilters.dateFrom && date < new Date(newFilters.dateFrom))
          return false;
        if (newFilters.dateTo && date > new Date(newFilters.dateTo))
          return false;
        return true;
      });
    }

    // Apply other filters
    if (newFilters.state && newFilters.state !== 'all') {
      filtered = filtered.filter(
        record => (record.state || record.State) === newFilters.state
      );
    }

    if (newFilters.city && newFilters.city !== 'all') {
      filtered = filtered.filter(
        record => (record.city || record.City) === newFilters.city
      );
    }

    if (newFilters.region && newFilters.region !== 'all') {
      filtered = filtered.filter(
        record => (record.region || record.Region) === newFilters.region
      );
    }

    if (newFilters.storeCode && newFilters.storeCode !== 'all') {
      filtered = filtered.filter(record => {
        const storeCode =
          record.storeCode || record['Store Code'] || record['Store No'];
        return storeCode === newFilters.storeCode;
      });
    }

    if (newFilters.npsCategory && newFilters.npsCategory !== 'all') {
      filtered = filtered.filter(record => {
        const score =
          record.npsScore ||
          record['NPS Score'] ||
          record[
            'On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'
          ];
        const nps = typeof score === 'number' ? score : parseInt(score || '0');

        if (newFilters.npsCategory === 'Promoter') return nps >= 9;
        if (newFilters.npsCategory === 'Passive') return nps >= 7 && nps < 9;
        if (newFilters.npsCategory === 'Detractor') return nps < 7;
        return true;
      });
    }

    if (newFilters.searchText) {
      const searchLower = newFilters.searchText.toLowerCase();
      filtered = filtered.filter(record =>
        JSON.stringify(record).toLowerCase().includes(searchLower)
      );
    }

    setFilteredData(filtered);
    setAggregates(calculateAggregates(filtered));

    toast.success(`Filters applied: ${filtered.length} records found`);
    setIsLoading(false);
    saveToLocalStorage();
  };

  // Use the internal function directly as applyFilters
  const applyFilters = applyFiltersInternal;

  const clearFilters = () => {
    setFilters({});
    setFilteredData(rawData);
    setAggregates(calculateAggregates(rawData));
    localStorage.removeItem('nps-filters');
    toast.success('Filters cleared');
  };

  const refreshData = async () => {
    const loaded = await loadFromBackend();
    if (!loaded) {
      loadFromLocalStorage();
    }
  };

  const setRawData = (data: NPSRecord[]) => {
    setRawDataState(data);
    setFilteredData(data);
    setAggregates(calculateAggregates(data));
    setHasData(data.length > 0);
    setLastUpdated(new Date());
    saveToLocalStorage();

    // Broadcast data update
    window.dispatchEvent(
      new CustomEvent('nps-data-updated', {
        detail: {
          records: data.length,
          aggregates: calculateAggregates(data),
        },
      })
    );
  };

  return (
    <DataContext.Provider
      value={{
        rawData,
        filteredData,
        aggregates,
        filters,
        filterOptions,
        setRawData,
        applyFilters,
        clearFilters,
        refreshData,
        saveToLocalStorage,
        loadFromLocalStorage,
        isLoading,
        hasData,
        lastUpdated,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
