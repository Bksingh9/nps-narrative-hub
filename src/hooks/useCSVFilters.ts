import { useState, useEffect, useCallback } from 'react';

interface FilterOptions {
  dateFrom?: Date;
  dateTo?: Date;
  state?: string;
  storeCode?: string;
  region?: string;
}

interface FilterOptionsData {
  states: string[];
  stores: { code: string; name: string }[];
  regions: string[];
  dateRange: { from: string | null; to: string | null };
}

export function useCSVFilters() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptionsData>({
    states: [],
    stores: [],
    regions: [],
    dateRange: { from: null, to: null },
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load filter options from backend
  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await fetch(
        'http://localhost:3001/api/crawler/csv/filter-options'
      );
      const result = await response.json();

      if (result.success) {
        setFilterOptions({
          states: result.states || [],
          stores: result.stores || [],
          regions: result.regions || [],
          dateRange: result.dateRange || { from: null, to: null },
        });
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }, []);

  // Apply filters to backend
  const applyFilters = useCallback(async () => {
    setIsLoading(true);

    const filterPayload = {
      dateFrom: filters.dateFrom?.toISOString(),
      dateTo: filters.dateTo?.toISOString(),
      state: filters.state === 'all' ? undefined : filters.state,
      storeCode: filters.storeCode === 'all' ? undefined : filters.storeCode,
      region: filters.region === 'all' ? undefined : filters.region,
    };

    // Clean undefined values
    Object.keys(filterPayload).forEach(key => {
      if (filterPayload[key as keyof typeof filterPayload] === undefined) {
        delete filterPayload[key as keyof typeof filterPayload];
      }
    });

    console.log('Applying filters:', filterPayload);

    // Dispatch custom event for CSVDataSync to handle
    window.dispatchEvent(
      new CustomEvent('apply-filters', {
        detail: filterPayload,
      })
    );

    setIsLoading(false);
  }, [filters]);

  // Update individual filter
  const updateFilter = useCallback((key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    // Apply empty filters to get all data
    window.dispatchEvent(
      new CustomEvent('apply-filters', {
        detail: {},
      })
    );
  }, []);

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();

    // Reload filter options when data is updated
    const handleDataUpdate = () => {
      loadFilterOptions();
    };

    window.addEventListener('nps-data-updated', handleDataUpdate);

    return () => {
      window.removeEventListener('nps-data-updated', handleDataUpdate);
    };
  }, [loadFilterOptions]);

  // Auto-apply filters when they change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(filters).length > 0) {
        applyFilters();
      }
    }, 500); // Debounce filter changes

    return () => clearTimeout(timer);
  }, [filters, applyFilters]);

  return {
    filters,
    filterOptions,
    isLoading,
    updateFilter,
    clearFilters,
    applyFilters,
    loadFilterOptions,
  };
}

export default useCSVFilters;
