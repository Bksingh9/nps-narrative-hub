import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Filter, X, Search, RefreshCw, Download } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';

interface Store {
  code: string;
  name: string;
}

interface HierarchicalOptions {
  states: string[];
  cities: string[];
  regions: string[];
  stores: Store[];
}

export function GlobalFilterBar() {
  const {
    filters: activeFilters,
    filterOptions,
    applyFilters,
    clearFilters,
    refreshData,
    isLoading,
    filteredData,
    aggregates,
  } = useData();

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filters, setFilters] = useState({
    state: activeFilters.state || 'all',
    city: activeFilters.city || 'all',
    region: activeFilters.region || 'all',
    storeCode: activeFilters.storeCode || 'all',
    storeNo: activeFilters.storeNo || '',
    format: activeFilters.format || 'all',
    subFormat: activeFilters.subFormat || 'all',
    npsCategory: activeFilters.npsCategory || 'all',
    searchText: activeFilters.searchText || '',
  });

  // State for hierarchical filter options
  const [hierarchicalOptions, setHierarchicalOptions] =
    useState<HierarchicalOptions>({
      states: filterOptions.states,
      cities: filterOptions.cities,
      regions: filterOptions.regions,
      stores: (filterOptions.stores as string[]).map(store => ({
        code: store,
        name: store,
      })),
    });

  // State to track if date range is auto-updated
  const [isDateRangeAutoUpdated, setIsDateRangeAutoUpdated] = useState(false);

  // State to track if there are pending filter changes
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Load hierarchical filter options
  const loadHierarchicalOptions = async (currentFilters: any) => {
    try {
      const params = new URLSearchParams();
      ['state', 'city', 'region', 'storeCode', 'format', 'subFormat'].forEach(
        key => {
          const v = currentFilters[key];
          if (v && v !== 'all') params.append(key, v);
        }
      );

      const response = await fetch(
        `http://localhost:3001/api/crawler/csv/filter-options?${params.toString()}`
      );
      const result = await response.json();

      if (result.success) {
        setHierarchicalOptions({
          states: result.states || [],
          cities: result.cities || [],
          regions: result.regions || [],
          stores: result.stores || [],
        });
      }
    } catch (error) {
      console.error('Error loading hierarchical options:', error);
    }
  };

  // Sync with active filters from context
  useEffect(() => {
    setFilters({
      state: activeFilters.state || 'all',
      city: activeFilters.city || 'all',
      region: activeFilters.region || 'all',
      storeCode: activeFilters.storeCode || 'all',
      storeNo: activeFilters.storeNo || '',
      format: activeFilters.format || 'all',
      subFormat: activeFilters.subFormat || 'all',
      npsCategory: activeFilters.npsCategory || 'all',
      searchText: activeFilters.searchText || '',
    });

    if (activeFilters.dateFrom || activeFilters.dateTo) {
      setDateRange({
        from: activeFilters.dateFrom
          ? new Date(activeFilters.dateFrom)
          : undefined,
        to: activeFilters.dateTo ? new Date(activeFilters.dateTo) : undefined,
      });
    }

    // Load hierarchical options when active filters change
    loadHierarchicalOptions(activeFilters);
  }, [activeFilters]);

  const handleApplyFilters = async () => {
    const newFilters: any = {};

    // Add date filters
    if (dateRange?.from) {
      newFilters.dateFrom = format(dateRange.from, 'yyyy-MM-dd');
    }
    if (dateRange?.to) {
      newFilters.dateTo = format(dateRange.to, 'yyyy-MM-dd');
    }

    // Add other filters
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof typeof filters];
      if (value && value !== 'all' && value !== '') {
        newFilters[key] = value;
      }
    });

    console.log('Applying filters:', newFilters);
    const result = await applyFilters(newFilters);

    // Clear pending changes flag
    setHasPendingChanges(false);

    // Auto-update date range based on filtered data if state or city is selected
    if (
      (filters.state && filters.state !== 'all') ||
      (filters.city && filters.city !== 'all')
    ) {
      if (result && result.success && result.aggregates?.dateRange) {
        const newDateRange = {
          from: result.aggregates.dateRange.from
            ? new Date(result.aggregates.dateRange.from)
            : undefined,
          to: result.aggregates.dateRange.to
            ? new Date(result.aggregates.dateRange.to)
            : undefined,
        };
        console.log('Auto-updating date range to:', newDateRange);
        setDateRange(newDateRange);

        // Show auto-update indicator
        setIsDateRangeAutoUpdated(true);
        setTimeout(() => setIsDateRangeAutoUpdated(false), 3000); // Clear after 3 seconds
      }
    }
  };

  // Handle filter changes with hierarchical reset
  const handleFilterChange = async (filterKey: string, value: string) => {
    console.log('handleFilterChange called with:', filterKey, value);
    const newFilters = { ...filters, [filterKey]: value };

    // Reset dependent filters when parent filter changes
    if (filterKey === 'state') {
      newFilters.city = 'all';
      newFilters.region = 'all';
      newFilters.storeCode = 'all';
    } else if (filterKey === 'city') {
      newFilters.storeCode = 'all';
    } else if (filterKey === 'region') {
      newFilters.storeCode = 'all';
    }

    setFilters(newFilters);
    setHasPendingChanges(true); // Mark that there are pending changes

    // Load updated hierarchical options
    await loadHierarchicalOptions(newFilters);
  };

  // Handle date range changes
  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    console.log('handleDateRangeChange called with:', newDateRange);

    // Clear auto-update indicator when manually changing date range
    setIsDateRangeAutoUpdated(false);

    // Update state only
    setDateRange(newDateRange);
    setHasPendingChanges(true); // Mark that there are pending changes
  };

  const handleClearFilters = () => {
    console.log('Clearing all filters');
    setDateRange(undefined);
    setIsDateRangeAutoUpdated(false);
    setHasPendingChanges(false);
    const clearedFilters = {
      state: 'all',
      city: 'all',
      region: 'all',
      storeCode: 'all',
      storeNo: '',
      format: 'all',
      subFormat: 'all',
      npsCategory: 'all',
      searchText: '',
    };
    setFilters(clearedFilters);

    // Reset hierarchical options to show all options
    loadHierarchicalOptions(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    // Only count filters that are actually applied (from activeFilters context)
    if (activeFilters.dateFrom || activeFilters.dateTo) count++;
    if (activeFilters.state && activeFilters.state !== 'all') count++;
    if (activeFilters.city && activeFilters.city !== 'all') count++;
    if (activeFilters.region && activeFilters.region !== 'all') count++;
    if (activeFilters.storeCode && activeFilters.storeCode !== 'all') count++;
    if (activeFilters.storeNo) count++;
    if (activeFilters.format && activeFilters.format !== 'all') count++;
    if (activeFilters.subFormat && activeFilters.subFormat !== 'all') count++;
    if (activeFilters.npsCategory && activeFilters.npsCategory !== 'all')
      count++;
    if (activeFilters.searchText) count++;
    return count;
  };

  return (
    <Card className="bg-card border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Global Filters</h3>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">{getActiveFilterCount()} Active</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {aggregates && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  NPS Score:{' '}
                  <Badge variant="outline">{aggregates.npsScore}</Badge>
                </span>
                <span className="text-muted-foreground">
                  Promoters:{' '}
                  <Badge variant="outline" className="text-green-600">
                    {aggregates.promoterPercent}%
                  </Badge>
                </span>
                <span className="text-muted-foreground">
                  Passives:{' '}
                  <Badge variant="outline" className="text-amber-600">
                    {aggregates.passivePercent}%
                  </Badge>
                </span>
                <span className="text-muted-foreground">
                  Detractors:{' '}
                  <Badge variant="outline" className="text-red-600">
                    {aggregates.detractorPercent}%
                  </Badge>
                </span>
              </div>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
            {getActiveFilterCount() > 0 && (
              <Button size="sm" variant="ghost" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="space-y-2 col-span-2">
            <div className="flex items-center gap-2 space-y-2">
              <Label className="w-full pb-[10px]">Date Range</Label>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal flex-1',
                      !dateRange?.from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from
                      ? format(dateRange.from, 'PPP')
                      : 'From date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange?.from}
                    onSelect={date =>
                      handleDateRangeChange({ ...dateRange, from: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal flex-1',
                      !dateRange?.to && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.to ? format(dateRange.to, 'PPP') : 'To date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange?.to}
                    onSelect={date =>
                      handleDateRangeChange({ ...dateRange, to: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* State Filter */}
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select
              value={filters.state}
              onValueChange={value => handleFilterChange('state', value)}
            >
              <SelectTrigger id="state">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {hierarchicalOptions.states.map(state => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City Filter */}
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Select
              value={filters.city}
              onValueChange={value => handleFilterChange('city', value)}
            >
              <SelectTrigger id="city">
                <SelectValue
                  placeholder={
                    filters.state === 'all'
                      ? 'All Cities'
                      : 'All Cities'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {hierarchicalOptions.cities.map(city => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Store Filter */}
          <div className="space-y-2">
            <Label htmlFor="store">Store</Label>
            <Select
              value={filters.storeCode}
              onValueChange={value => handleFilterChange('storeCode', value)}
            >
              <SelectTrigger id="store">
                <SelectValue
                  placeholder={'All Stores'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {hierarchicalOptions.stores.map(store => (
                  <SelectItem key={store.code} value={store.code}>
                    {store.code} - {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Region Filter */}
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select
              value={filters.region}
              onValueChange={value => handleFilterChange('region', value)}
            >
              <SelectTrigger id="region">
                <SelectValue
                  placeholder={
                    filters.state === 'all'
                      ? 'All Regions'
                      : 'All Regions'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {hierarchicalOptions.regions.map(region => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* NPS Category */}
          <div className="space-y-2">
            <Label htmlFor="nps-category">NPS Category</Label>
            <Select
              value={filters.npsCategory}
              onValueChange={value =>
                setFilters({ ...filters, npsCategory: value })
              }
            >
              <SelectTrigger id="nps-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Promoter">Promoters (9-10)</SelectItem>
                <SelectItem value="Passive">Passives (7-8)</SelectItem>
                <SelectItem value="Detractor">Detractors (0-6)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Search..."
                value={filters.searchText}
                onChange={e =>
                  setFilters({ ...filters, searchText: e.target.value })
                }
                className="pl-8"
              />
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex items-end">
            <Button
              onClick={handleApplyFilters}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Filter className="mr-2 h-4 w-4" />
                  Apply Filters
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filter Summary */}
        {aggregates && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                NPS Score:{' '}
                <Badge variant="outline">{aggregates.npsScore}</Badge>
              </span>
              <span className="text-muted-foreground">
                Promoters:{' '}
                <Badge variant="outline" className="text-green-600">
                  {aggregates.promoterPercent}%
                </Badge>
              </span>
              <span className="text-muted-foreground">
                Detractors:{' '}
                <Badge variant="outline" className="text-red-600">
                  {aggregates.detractorPercent}%
                </Badge>
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredData.length.toLocaleString()} records • Last updated:{' '}
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
