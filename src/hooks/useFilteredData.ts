import { useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext';

export interface DataItem {
  id: string;
  name: string;
  store?: string;
  state?: string;
  region?: string;
  date?: Date | string;
  [key: string]: any;
}

export function useFilteredData<T extends DataItem>(data: T[]): T[] {
  const { filters } = useFilters();

  return useMemo(() => {
    return data.filter(item => {
      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const itemDate = item.date ? new Date(item.date) : null;
        if (itemDate) {
          if (filters.dateRange.from && itemDate < filters.dateRange.from)
            return false;
          if (filters.dateRange.to && itemDate > filters.dateRange.to)
            return false;
        }
      }

      // Store filter
      if (
        filters.selectedStore &&
        item.store &&
        item.store !== filters.selectedStore
      ) {
        return false;
      }

      // State filter
      if (
        filters.selectedState &&
        item.state &&
        item.state !== filters.selectedState
      ) {
        return false;
      }

      // Region filter
      if (
        filters.selectedRegion &&
        item.region &&
        item.region !== filters.selectedRegion
      ) {
        return false;
      }

      return true;
    });
  }, [data, filters]);
}

// Helper hook for getting filter summary
export function useFilterSummary() {
  const { filters } = useFilters();

  return useMemo(() => {
    const activeFilters = [];

    if (filters.dateRange.from || filters.dateRange.to) {
      if (filters.dateRange.from && filters.dateRange.to) {
        activeFilters.push(
          `Date: ${filters.dateRange.from.toLocaleDateString()} - ${filters.dateRange.to.toLocaleDateString()}`
        );
      } else if (filters.dateRange.from) {
        activeFilters.push(
          `From: ${filters.dateRange.from.toLocaleDateString()}`
        );
      } else if (filters.dateRange.to) {
        activeFilters.push(
          `Until: ${filters.dateRange.to.toLocaleDateString()}`
        );
      }
    }

    if (filters.selectedStore) {
      activeFilters.push(`Store: ${filters.selectedStore}`);
    }

    if (filters.selectedState) {
      activeFilters.push(`State: ${filters.selectedState}`);
    }

    if (filters.selectedRegion) {
      activeFilters.push(`Region: ${filters.selectedRegion}`);
    }

    return {
      hasActiveFilters: activeFilters.length > 0,
      activeFilters,
      summary: activeFilters.join(', '),
    };
  }, [filters]);
}
