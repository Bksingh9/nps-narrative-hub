import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { CalendarIcon, Filter, RefreshCw, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FilterOptions {
  states: string[];
  stores: { code: string; name: string }[];
  regions: string[];
  cities: string[];
  formats: string[];
  subFormats: string[];
}

interface UniversalFilterBarProps {
  onFiltersChange: (filters: any) => void;
  showFields?: string[];
  className?: string;
}

export function UniversalFilterBar({
  onFiltersChange,
  showFields = ['dateRange', 'state', 'region', 'city', 'storeCode', 'format'],
  className,
}: UniversalFilterBarProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    state: '',
    region: '',
    city: '',
    storeCode: '',
    storeNo: '',
    format: '',
    subFormat: '',
    searchText: '',
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    states: [],
    stores: [],
    regions: [],
    cities: [],
    formats: [],
    subFormats: [],
  });

  const [isLoading, setIsLoading] = useState(false);

  // Load filter options from backend
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
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
          cities: result.cities || [],
          formats: result.formats || [],
          subFormats: result.subFormats || [],
        });
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const applyFilters = async () => {
    setIsLoading(true);

    const activeFilters: any = {};

    // Add date range
    if (dateRange?.from) {
      activeFilters.dateFrom = format(dateRange.from, 'yyyy-MM-dd');
    }
    if (dateRange?.to) {
      activeFilters.dateTo = format(dateRange.to, 'yyyy-MM-dd');
    }

    // Add other filters
    Object.keys(filters).forEach(key => {
      if (
        filters[key as keyof typeof filters] &&
        filters[key as keyof typeof filters] !== 'all'
      ) {
        activeFilters[key] = filters[key as keyof typeof filters];
      }
    });

    console.log('Applying filters:', activeFilters);

    try {
      const response = await fetch(
        'http://localhost:3001/api/crawler/csv/filter',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters: activeFilters }),
        }
      );

      const result = await response.json();

      if (result.success) {
        onFiltersChange(result);
        toast.success(`Filtered: ${result.totalRecords} records found`);
      }
    } catch (error) {
      toast.error('Failed to apply filters');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setDateRange(undefined);
    setFilters({
      dateFrom: '',
      dateTo: '',
      state: '',
      region: '',
      city: '',
      storeCode: '',
      storeNo: '',
      format: '',
      subFormat: '',
      searchText: '',
    });
    applyFilters();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className={cn('mb-6', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Data Filters</h3>
          <span className="text-sm text-muted-foreground ml-auto">
            Filter your CSV data by multiple criteria
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Filter */}
          {showFields.includes('dateRange') && (
            <div className="space-y-2">
              <Label>Response Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* State Filter */}
          {showFields.includes('state') && (
            <div className="space-y-2">
              <Label>State</Label>
              <Select
                value={filters.state}
                onValueChange={value => handleFilterChange('state', value)}
              >
                <SelectTrigger>
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
          )}

          {/* Region Filter */}
          {showFields.includes('region') && (
            <div className="space-y-2">
              <Label>Region Code</Label>
              <Select
                value={filters.region}
                onValueChange={value => handleFilterChange('region', value)}
              >
                <SelectTrigger>
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
          )}

          {/* City Filter */}
          {showFields.includes('city') && (
            <div className="space-y-2">
              <Label>City</Label>
              <Select
                value={filters.city}
                onValueChange={value => handleFilterChange('city', value)}
              >
                <SelectTrigger>
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
          )}

          {/* Store Code Filter */}
          {showFields.includes('storeCode') && (
            <div className="space-y-2">
              <Label>Store Code</Label>
              <Select
                value={filters.storeCode}
                onValueChange={value => handleFilterChange('storeCode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {filterOptions.stores.map(store => (
                    <SelectItem key={store.code} value={store.code}>
                      {store.code} - {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Store No Filter */}
          {showFields.includes('storeNo') && (
            <div className="space-y-2">
              <Label>Store No</Label>
              <Input
                placeholder="Enter Store No"
                value={filters.storeNo}
                onChange={e => handleFilterChange('storeNo', e.target.value)}
              />
            </div>
          )}

          {/* Format Filter */}
          {showFields.includes('format') && (
            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={filters.format}
                onValueChange={value => handleFilterChange('format', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  {filterOptions.formats.map(format => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sub Format Filter */}
          {showFields.includes('subFormat') && (
            <div className="space-y-2">
              <Label>Sub Format</Label>
              <Select
                value={filters.subFormat}
                onValueChange={value => handleFilterChange('subFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sub Formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub Formats</SelectItem>
                  {filterOptions.subFormats.map(subFormat => (
                    <SelectItem key={subFormat} value={subFormat}>
                      {subFormat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Search Text Filter */}
          {showFields.includes('search') && (
            <div className="space-y-2">
              <Label>Search Feedback</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search in comments..."
                  className="pl-8"
                  value={filters.searchText}
                  onChange={e =>
                    handleFilterChange('searchText', e.target.value)
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
          <Button onClick={applyFilters} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default UniversalFilterBar;
