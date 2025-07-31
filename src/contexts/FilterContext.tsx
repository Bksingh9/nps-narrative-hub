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
  const [filters, setFilters] = useState<FilterState>(initialFilters);

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