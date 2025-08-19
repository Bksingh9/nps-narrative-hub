import { useState, useEffect } from 'react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { SideNav } from '@/components/layout/SideNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { 
  Upload as UploadIcon, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Download,
  Loader2,
  Filter,
  Calendar as CalendarIcon,
  RefreshCw,
  Trash2,
  TrendingUp,
  Users,
  Store
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import csvDataService, { FilterOptions, FilterOptionsResponse } from '@/services/csvDataService';
import authService from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import DataExportButton from '@/components/DataExportButton';
import { toast } from 'sonner';

export default function Upload() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [userRole] = useState<'admin' | 'user' | 'store_manager'>(currentUser?.role || 'user');
  
  // Redirect non-admin users
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      toast.error('Access denied. Only administrators can upload data.');
      navigate('/');
    }
  }, [currentUser, navigate]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  
  // Data state
  const [currentData, setCurrentData] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({});
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  
  // Aggregates
  const [aggregates, setAggregates] = useState<any>(null);

  // Load initial state on mount
  useEffect(() => {
    loadInitialState();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    if (metadata) {
      applyFilters();
    }
  }, [filters, dateFrom, dateTo]);

  const loadInitialState = async () => {
    try {
      // Check if there's data on the server
      const currentState = await csvDataService.getCurrentDataState();
      
      if (currentState.hasData) {
        setMetadata(currentState.metadata);
        
        // Load filter options
        const options = await csvDataService.getFilterOptions();
        setFilterOptions(options);
        
        // Load initial data
        await applyFilters();
        
        toast.success('Previous data session restored');
      }
    } catch (error) {
      console.error('Error loading initial state:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadMessage('Processing CSV file...');

    try {
      const result = await csvDataService.uploadCSV(selectedFile);
      
      if (result.success) {
        setMetadata(result.metadata);
        setUploadStatus('success');
        setUploadMessage(`Successfully processed ${result.totalRecords} records`);
        
        // Load filter options
        const options = await csvDataService.getFilterOptions();
        setFilterOptions(options);
        
        // Reset filters and load all data
        setFilters({});
        setDateFrom(undefined);
        setDateTo(undefined);
        await applyFilters();
        
        toast.success('CSV uploaded and processed successfully');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      setUploadStatus('error');
      setUploadMessage(error.message || 'Failed to upload file');
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const applyFilters = async () => {
    setIsFiltering(true);
    
    try {
      const filterParams: FilterOptions = {
        ...filters,
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
      };
      
      const result = await csvDataService.filterData(filterParams);
      
      if (result.success) {
        setCurrentData(result.data);
        setAggregates(result.aggregates);
      }
    } catch (error: any) {
      toast.error('Failed to apply filters');
      console.error('Filter error:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all data?')) {
      try {
        await csvDataService.clearData();
        setCurrentData([]);
        setMetadata(null);
        setFilterOptions(null);
        setAggregates(null);
        setFilters({});
        setDateFrom(undefined);
        setDateTo(undefined);
        toast.success('Data cleared successfully');
      } catch (error) {
        toast.error('Failed to clear data');
      }
    }
  };

  const handleExport = () => {
    if (currentData.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    csvDataService.exportToCSV(currentData);
    toast.success('Data exported successfully');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <div className="flex h-screen bg-gray-50">
        <SideNav userRole={userRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderBar 
          userRole={userRole}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
          <div>
                <h1 className="text-3xl font-bold text-gray-900">Real-Time CSV Data Processing</h1>
                <p className="text-gray-600 mt-1">Upload and analyze NPS data with dynamic filtering</p>
              </div>
              {metadata && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="destructive" onClick={handleClearData}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Data
                  </Button>
                </div>
              )}
            </div>

            {/* KPI Cards */}
            {aggregates && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">NPS Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{Math.round(aggregates.npsScore || 0)}</span>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Responses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{aggregates.totalResponses || 0}</span>
                      <Users className="w-4 h-4 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Promoters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-green-600">{aggregates.promoters || 0}</span>
                      <Badge variant="outline" className="text-xs">
                        {aggregates.totalResponses > 0 
                          ? `${Math.round((aggregates.promoters / aggregates.totalResponses) * 100)}%`
                          : '0%'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Detractors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-red-600">{aggregates.detractors || 0}</span>
                      <Badge variant="outline" className="text-xs">
                        {aggregates.totalResponses > 0 
                          ? `${Math.round((aggregates.detractors / aggregates.totalResponses) * 100)}%`
                          : '0%'}
                            </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Tabs defaultValue="upload" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upload">Upload CSV</TabsTrigger>
                <TabsTrigger value="filters" disabled={!metadata}>Filters</TabsTrigger>
                <TabsTrigger value="data" disabled={!currentData.length}>Data Preview</TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload CSV File</CardTitle>
                    <CardDescription>
                      Upload your NPS data CSV file. The system will automatically detect columns for Response Date, State, Store Code, and NPS scores.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                      
                      <div className="mt-4">
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Click to upload or drag and drop
                          </span>
                          <Input
                            id="file-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="sr-only"
                          />
                        </Label>
                        <p className="mt-1 text-xs text-gray-500">CSV files up to 10MB</p>
                      </div>
                      
                      {selectedFile && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                          <Badge variant="outline">{(selectedFile.size / 1024).toFixed(2)} KB</Badge>
                        </div>
                      )}
                    </div>

                    {uploadStatus !== 'idle' && (
                      <Alert className={cn(
                        uploadStatus === 'success' && 'border-green-500',
                        uploadStatus === 'error' && 'border-red-500'
                      )}>
                        {uploadStatus === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
                        {uploadStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {uploadStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        <AlertDescription>{uploadMessage}</AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      onClick={handleUpload} 
                      disabled={!selectedFile || isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <UploadIcon className="mr-2 h-4 w-4" />
                          Upload and Process
                        </>
                      )}
                    </Button>

                    {metadata && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Upload Summary</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Records:</span>
                            <span className="font-medium">{metadata.totalRecords}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date Range:</span>
                            <span className="font-medium">
                              {metadata.dateRange?.from && metadata.dateRange?.to
                                ? `${format(new Date(metadata.dateRange.from), 'MMM d, yyyy')} - ${format(new Date(metadata.dateRange.to), 'MMM d, yyyy')}`
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Average NPS:</span>
                            <span className="font-medium">{metadata.aggregates?.averageNPS?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Filters Tab */}
              <TabsContent value="filters">
                <Card>
                  <CardHeader>
                    <CardTitle>Real-Time Filters</CardTitle>
                    <CardDescription>
                      Apply filters to analyze specific segments of your data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Date Range Filter */}
                      <div className="space-y-2">
                        <Label>Date From</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateFrom && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dateFrom}
                              onSelect={setDateFrom}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Date To</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateTo && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateTo ? format(dateTo, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dateTo}
                              onSelect={setDateTo}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* State Filter */}
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Select 
                          value={filters.state || 'all'} 
                          onValueChange={(value) => setFilters({...filters, state: value === 'all' ? undefined : value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All States" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All States</SelectItem>
                            {filterOptions?.states.map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Store Code Filter */}
                      <div className="space-y-2">
                        <Label>Store Code</Label>
                        <Select 
                          value={filters.storeCode || 'all'} 
                          onValueChange={(value) => setFilters({...filters, storeCode: value === 'all' ? undefined : value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Stores" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Stores</SelectItem>
                            {filterOptions?.stores.map(store => (
                              <SelectItem key={(store as any).code || store as any} value={(store as any).code || (store as any)}>
                                {(store as any).code ? `${(store as any).code} - ${(store as any).name}` : (store as any)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Region Filter */}
                      <div className="space-y-2">
                        <Label>Region</Label>
                        <Select 
                          value={filters.region || 'all'} 
                          onValueChange={(value) => setFilters({...filters, region: value === 'all' ? undefined : value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Regions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Regions</SelectItem>
                            {filterOptions?.regions.map(region => (
                              <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* NPS Category Filter */}
                      <div className="space-y-2">
                        <Label>NPS Category</Label>
                        <Select 
                          value={filters.npsCategory || 'all'} 
                          onValueChange={(value) => setFilters({...filters, npsCategory: value === 'all' ? undefined : value as any})}
                        >
                          <SelectTrigger>
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
                </div>
                
                    <Separator />

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Showing {currentData.length} of {metadata?.totalRecords || 0} records
                      </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                          onClick={() => {
                            setFilters({});
                            setDateFrom(undefined);
                            setDateTo(undefined);
                          }}
                        >
                          Clear Filters
                  </Button>
                        <Button onClick={applyFilters} disabled={isFiltering}>
                          {isFiltering ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
            </CardContent>
          </Card>
              </TabsContent>

              {/* Data Preview Tab */}
              <TabsContent value="data">
                <Card>
            <CardHeader>
                    <CardTitle>Data Preview</CardTitle>
                    <CardDescription>
                      Showing filtered NPS data records
                    </CardDescription>
            </CardHeader>
            <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Store Code</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Store Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">NPS Score</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Response Date</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentData.slice(0, 10).map((record, index) => (
                            <tr key={record.id || index}>
                              <td className="px-4 py-2 text-sm">{record.storeCode}</td>
                              <td className="px-4 py-2 text-sm">{record.storeName}</td>
                              <td className="px-4 py-2 text-sm">{record.state}</td>
                              <td className="px-4 py-2 text-sm">{record.region}</td>
                              <td className="px-4 py-2 text-sm">
                                <Badge variant={
                                  record.npsCategory === 'Promoter' ? 'default' :
                                  record.npsCategory === 'Passive' ? 'secondary' : 'destructive'
                                }>
                                  {record.npsScore}
                                </Badge>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <Badge variant="outline">{record.npsCategory}</Badge>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {record.responseDate ? format(new Date(record.responseDate), 'MMM d, yyyy') : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {currentData.length > 10 && (
                        <div className="mt-4 text-center text-sm text-gray-500">
                          Showing 10 of {currentData.length} records
                      </div>
                      )}
              </div>
            </CardContent>
          </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}