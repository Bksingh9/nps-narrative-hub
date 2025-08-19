import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon, RotateCcw, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilters } from "@/contexts/FilterContext";
import { safeGetRecords, onNpsDataUpdated, extractStore, extractState, extractRegion, extractCity } from "@/lib/data";

export function FilterBar() {
  const { filters, updateDateRange, updateStore, updateState, updateRegion, updateCity, resetFilters } = useFilters();
  const [version, setVersion] = useState(0);
  
  // Listen for data updates
  useEffect(() => {
    const off = onNpsDataUpdated(() => setVersion(v => v + 1));
    return off;
  }, []);
  
  // Dynamically extract unique values from actual data
  const { stores, states, regions, cities } = useMemo(() => {
    const records = safeGetRecords();
    const storeSet = new Set<string>();
    const stateSet = new Set<string>();
    const regionSet = new Set<string>();
    const citySet = new Set<string>();
    
    for (const record of records) {
      const store = extractStore(record);
      const state = extractState(record);
      const region = extractRegion(record);
      const city = extractCity(record);
      
      if (store) storeSet.add(String(store));
      if (state) stateSet.add(String(state));
      if (region) regionSet.add(String(region));
      if (city) citySet.add(String(city));
    }
    
    // Convert to arrays and sort
    const stores = [
      { value: "all", label: "All Stores" },
      ...Array.from(storeSet).sort().map(s => ({ value: s, label: s }))
    ];
    
    const states = [
      { value: "all", label: "All States" },
      ...Array.from(stateSet).sort().map(s => ({ value: s, label: s }))
    ];
    
    const regions = [
      { value: "all", label: "All Regions" },
      ...Array.from(regionSet).sort().map(s => ({ value: s, label: s }))
    ];
    
    const cities = [
      { value: "all", label: "All Cities" },
      ...Array.from(citySet).sort().map(s => ({ value: s, label: s }))
    ];
    
    return { stores, states, regions, cities };
  }, [version]);

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    filters.dateRange.from && filters.dateRange.to 
      ? { from: filters.dateRange.from, to: filters.dateRange.to }
      : undefined
  );

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    updateDateRange({
      from: range?.from,
      to: range?.to
    });
  };

  const hasActiveFilters = 
    filters.dateRange.from || 
    filters.selectedStore !== '' || 
    filters.selectedState !== '' || 
    filters.selectedRegion !== '' ||
    filters.selectedCity !== '';

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Select date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {/* Store Filter */}
          <Select value={filters.selectedStore || "all"} onValueChange={(value) => updateStore(value === "all" ? "" : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Stores" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.value} value={store.value}>
                  {store.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* State Filter */}
          <Select value={filters.selectedState || "all"} onValueChange={(value) => updateState(value === "all" ? "" : value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Region Filter */}
          <Select value={filters.selectedRegion || "all"} onValueChange={(value) => updateRegion(value === "all" ? "" : value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City Filter - New addition */}
          {cities.length > 1 && (
            <Select value={filters.selectedCity || "all"} onValueChange={(value) => updateCity(value === "all" ? "" : value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}