import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface FilterState {
  dateRange: DateRange;
  selectedStore: string;
  selectedState: string;
  selectedRegion: string;
}

interface FilterContextType {
  filters: FilterState;
  updateDateRange: (range: DateRange) => void;
  updateStore: (store: string) => void;
  updateState: (state: string) => void;
  updateRegion: (region: string) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const initialFilters: FilterState = {
  dateRange: { from: undefined, to: undefined },
  selectedStore: '',
  selectedState: '',
  selectedRegion: ''
};

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(() => {
    const saved = localStorage.getItem('nps-filters');
    if (!saved) return initialFilters;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...initialFilters,
        ...parsed,
        dateRange: {
          from: parsed?.dateRange?.from ? new Date(parsed.dateRange.from) : undefined,
          to: parsed?.dateRange?.to ? new Date(parsed.dateRange.to) : undefined,
        },
      } as FilterState;
    } catch {
      return initialFilters;
    }
  });

  const updateDateRange = (range: DateRange) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  };

  const updateStore = (store: string) => {
    setFilters(prev => ({ ...prev, selectedStore: store }));
  };

  const updateState = (state: string) => {
    setFilters(prev => ({ ...prev, selectedState: state }));
  };

  const updateRegion = (region: string) => {
    setFilters(prev => ({ ...prev, selectedRegion: region }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  React.useEffect(() => {
    const toSave = {
      ...filters,
      dateRange: {
        from: filters.dateRange.from ? filters.dateRange.from.toISOString() : undefined,
        to: filters.dateRange.to ? filters.dateRange.to.toISOString() : undefined,
      },
    };
    localStorage.setItem('nps-filters', JSON.stringify(toSave));
  }, [filters]);

  return (
    <FilterContext.Provider
      value={{
        filters,
        updateDateRange,
        updateStore,
        updateState,
        updateRegion,
        resetFilters
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}