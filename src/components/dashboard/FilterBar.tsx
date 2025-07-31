import React from 'react';
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

const stores = [
  { value: "all", label: "All Stores" },
  { value: "store-001", label: "Downtown Mumbai" },
  { value: "store-002", label: "Central Delhi" },
  { value: "store-003", label: "Tech Park Bangalore" },
  { value: "store-004", label: "Marina Chennai" },
  { value: "store-005", label: "City Center Pune" }
];

const states = [
  { value: "all", label: "All States" },
  { value: "maharashtra", label: "Maharashtra" },
  { value: "delhi", label: "Delhi" },
  { value: "karnataka", label: "Karnataka" },
  { value: "tamil-nadu", label: "Tamil Nadu" },
  { value: "west-bengal", label: "West Bengal" }
];

const regions = [
  { value: "all", label: "All Regions" },
  { value: "north", label: "North India" },
  { value: "south", label: "South India" },
  { value: "east", label: "East India" },
  { value: "west", label: "West India" },
  { value: "central", label: "Central India" }
];

export function FilterBar() {
  const { filters, updateDateRange, updateStore, updateState, updateRegion, resetFilters } = useFilters();
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
    filters.selectedRegion !== '';

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
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Store Filter */}
          <Select value={filters.selectedStore || "all"} onValueChange={(value) => updateStore(value === "all" ? "" : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select store" />
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
              <SelectValue placeholder="Select state" />
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
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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