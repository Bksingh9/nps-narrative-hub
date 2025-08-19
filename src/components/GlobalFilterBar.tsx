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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  Filter, 
  X, 
  Search, 
  RefreshCw,
  Download 
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';

export function GlobalFilterBar() {
  const { 
    filters: activeFilters,
    filterOptions,
    applyFilters,
    clearFilters,
    refreshData,
    isLoading,
    filteredData,
    aggregates
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
    searchText: activeFilters.searchText || ''
  });

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
      searchText: activeFilters.searchText || ''
    });
    
    if (activeFilters.dateFrom || activeFilters.dateTo) {
      setDateRange({
        from: activeFilters.dateFrom ? new Date(activeFilters.dateFrom) : undefined,
        to: activeFilters.dateTo ? new Date(activeFilters.dateTo) : undefined
      });
    }
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
    
    await applyFilters(newFilters);
  };

  const handleClearFilters = () => {
    setDateRange(undefined);
    setFilters({
      state: 'all',
      city: 'all',
      region: 'all',
      storeCode: 'all',
      storeNo: '',
      format: 'all',
      subFormat: 'all',
      npsCategory: 'all',
      searchText: ''
    });
    clearFilters();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (dateRange?.from || dateRange?.to) count++;
    Object.values(filters).forEach(value => {
      if (value && value !== 'all' && value !== '') count++;
    });
    return count;
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Global Filters</h3>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFilterCount()} Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {aggregates && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  NPS Score: <Badge variant="outline">{aggregates.npsScore}</Badge>
                </span>
                <span className="text-muted-foreground">
                  Promoters: <Badge variant="outline" className="text-green-600">{aggregates.promoterPercent}%</Badge>
                </span>
                <span className="text-muted-foreground">
                  Passives: <Badge variant="outline" className="text-amber-600">{aggregates.passivePercent}%</Badge>
                </span>
                <span className="text-muted-foreground">
                  Detractors: <Badge variant="outline" className="text-red-600">{aggregates.detractorPercent}%</Badge>
                </span>
              </div>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {getActiveFilterCount() > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="space-y-2 col-span-2">
            <Label>Date Range</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal flex-1",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? format(dateRange.from, "PPP") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange?.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal flex-1",
                      !dateRange?.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.to ? format(dateRange.to, "PPP") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange?.to}
                    onSelect={(date) => setDateRange({ ...dateRange, to: date })}
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
              onValueChange={(value) => setFilters({ ...filters, state: value })}
            >
              <SelectTrigger id="state">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {filterOptions.states.map(state => (
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
              onValueChange={(value) => setFilters({ ...filters, city: value })}
            >
              <SelectTrigger id="city">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {filterOptions.cities.map(city => (
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
              onValueChange={(value) => setFilters({ ...filters, storeCode: value })}
            >
              <SelectTrigger id="store">
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {filterOptions.stores.map(store => (
                  <SelectItem key={store} value={store}>
                    {store}
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
              onValueChange={(value) => setFilters({ ...filters, region: value })}
            >
              <SelectTrigger id="region">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {filterOptions.regions.map(region => (
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
              onValueChange={(value) => setFilters({ ...filters, npsCategory: value })}
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
                onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
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
                  Loading...
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
                NPS Score: <Badge variant="outline">{aggregates.npsScore}</Badge>
              </span>
              <span className="text-muted-foreground">
                Promoters: <Badge variant="outline" className="text-green-600">{aggregates.promoterPercent}%</Badge>
              </span>
              <span className="text-muted-foreground">
                Detractors: <Badge variant="outline" className="text-red-600">{aggregates.detractorPercent}%</Badge>
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredData.length.toLocaleString()} records • 
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 