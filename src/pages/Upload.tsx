import { useState, useEffect } from 'react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { SideNav } from '@/components/layout/SideNav';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload as UploadIcon,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
  Save,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import authService from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Papa from 'papaparse';
import {
  safeGetRecords,
  setRecords,
  computeNps,
  extractDate,
  extractScore,
  extractStore,
  extractState,
  extractRegion,
} from '@/lib/data';

export default function Upload() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [userRole] = useState<'admin' | 'user' | 'store_manager'>(
    currentUser?.role || 'user'
  );

  // Redirect non-admin users
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      toast.error('Access denied. Only administrators can upload data.');
      navigate('/');
    }
  }, [currentUser, navigate]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  // Data state
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [savedRecords, setSavedRecords] = useState<any[]>([]);
  const [aggregates, setAggregates] = useState<any>(null);

  // Load saved records on mount
  useEffect(() => {
    const saved = safeGetRecords();
    setSavedRecords(saved);
    if (saved.length > 0) {
      const agg = computeNps(saved);
      setAggregates({
        npsScore: agg.nps,
        totalResponses: agg.total,
        promoters: saved.filter(r => extractScore(r) >= 9).length,
        detractors: saved.filter(r => extractScore(r) <= 6).length,
      });
    }
  }, []);

  // Normalize row function
  const normalizeRow = (row: any) => {
    return {
      responseDate: extractDate(row),
      nps: extractScore(row),
      storeCode: extractStore(row),
      state: extractState(row),
      region: extractRegion(row),
      comments:
        row['Comments'] ||
        row['Feedback'] ||
        row['Remark'] ||
        row['Observation'] ||
        '',
    };
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
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (h: string) => h.trim(),
        complete: (results: Papa.ParseResult<any>) => {
          try {
            const rows = results.data;
            const processed = rows.map(row => {
              row._normalized = normalizeRow(row);
              return row;
            });

            // Deduplicate by JSON.stringify
            const existing = safeGetRecords();
            const existingSet = new Set(existing.map(r => JSON.stringify(r)));
            const newRows = processed.filter(
              r => !existingSet.has(JSON.stringify(r))
            );

            setParsedData(processed);
            setUploadStatus('success');
            setUploadMessage(
              `Successfully parsed ${processed.length} records (${newRows.length} new)`
            );

            const agg = computeNps(processed);
            setAggregates({
              npsScore: agg.nps,
              totalResponses: agg.total,
              promoters: processed.filter(r => extractScore(r) >= 9).length,
              detractors: processed.filter(r => extractScore(r) <= 6).length,
            });

            toast.success('CSV processed successfully');
          } catch (error: any) {
            setUploadStatus('error');
            setUploadMessage('Failed to process CSV data');
            toast.error(error.message || 'Processing failed');
          } finally {
            setIsUploading(false);
          }
        },
        error: (error: any) => {
          setUploadStatus('error');
          setUploadMessage(error.message || 'Failed to parse CSV');
          toast.error('Failed to parse CSV file');
          setIsUploading(false);
        },
      });
    } catch (error: any) {
      setUploadStatus('error');
      setUploadMessage(error.message || 'Failed to upload file');
      toast.error(error.message || 'Upload failed');
      setIsUploading(false);
    }
  };

  const handleSaveData = () => {
    if (parsedData.length === 0) {
      toast.error('No data to save');
      return;
    }

    try {
      const existing = safeGetRecords();
      const existingSet = new Set(existing.map(r => JSON.stringify(r)));
      const newRows = parsedData.filter(
        r => !existingSet.has(JSON.stringify(r))
      );
      const merged = [...existing, ...newRows];

      setRecords(merged);
      setSavedRecords(merged);
      toast.success(
        `Saved dataset: ${merged.length} records (${newRows.length} new)`
      );
    } catch (error: any) {
      toast.error('Failed to save data');
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      try {
        setRecords([]);
        setParsedData([]);
        setSavedRecords([]);
        setAggregates(null);
        toast.success('Data cleared successfully');
      } catch (error) {
        toast.error('Failed to clear data');
      }
    }
  };

  const handleExport = () => {
    const dataToExport = savedRecords.length > 0 ? savedRecords : parsedData;
    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = Papa.unparse(dataToExport);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nps-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar userRole={userRole} onLogout={handleLogout} />
      <div className="flex">
        <SideNav userRole={userRole} />

        <main className="flex-1 p-6 overflow-y-auto pr-0">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="text-left">
                <h1 className="text-3xl font-bold">
                  Real-Time CSV Data Processing
                </h1>
                <p className="text-muted-foreground">
                  Upload and analyze NPS data with dynamic filtering
                </p>
              </div>
              {(savedRecords.length > 0 || parsedData.length > 0) && (
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      NPS Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {Math.round(aggregates.npsScore || 0)}
                      </span>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Responses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {aggregates.totalResponses || 0}
                      </span>
                      <Users className="w-4 h-4 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Promoters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-green-600">
                        {aggregates.promoters || 0}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {aggregates.totalResponses > 0
                          ? `${Math.round(
                              (aggregates.promoters /
                                aggregates.totalResponses) *
                                100
                            )}%`
                          : '0%'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Detractors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-red-600">
                        {aggregates.detractors || 0}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {aggregates.totalResponses > 0
                          ? `${Math.round(
                              (aggregates.detractors /
                                aggregates.totalResponses) *
                                100
                            )}%`
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
                <TabsTrigger value="data" disabled={parsedData.length === 0}>
                  Data Preview
                </TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload CSV File</CardTitle>
                    <CardDescription>
                      Upload your NPS data CSV file. The system will
                      automatically detect columns for Response Date, State,
                      Store Code, and NPS scores.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground" />

                      <div className="mt-4">
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-semibold text-muted-foreground">
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
                        <p className="mt-1 text-xs text-muted-foreground">
                          CSV files up to 10MB
                        </p>
                      </div>

                      {selectedFile && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {selectedFile.name}
                          </span>
                          <Badge variant="outline">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </Badge>
                        </div>
                      )}
                    </div>

                    {uploadStatus !== 'idle' && (
                      <Alert
                        className={cn(
                          uploadStatus === 'success' && 'border-green-500',
                          uploadStatus === 'error' && 'border-red-500'
                        )}
                      >
                        {uploadStatus === 'uploading' && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {uploadStatus === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {uploadStatus === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <AlertDescription>{uploadMessage}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
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

                      {parsedData.length > 0 && (
                        <Button
                          onClick={handleSaveData}
                          variant="outline"
                          className="w-full"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save Data ({parsedData.length} records)
                        </Button>
                      )}
                    </div>

                    {parsedData.length > 0 && (
                      <div className="mt-4 p-4 bg-background rounded-lg border-muted">
                        <h4 className="font-medium mb-2">Upload Summary</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Parsed Records:
                            </span>
                            <span className="font-medium">
                              {parsedData.length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Saved Records:
                            </span>
                            <span className="font-medium">
                              {savedRecords.length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              NPS Score:
                            </span>
                            <span className="font-medium">
                              {aggregates?.npsScore || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Data Preview Tab */}
              <TabsContent value="data">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Preview</CardTitle>
                    <CardDescription>
                      Preview of processed CSV data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {parsedData.length > 0 ? (
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          Showing first 10 records of {parsedData.length} total
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-muted bg-background rounded-sm">
                            <thead>
                              <tr>
                                <th className="border border-gray-200 p-2">
                                  Date
                                </th>
                                <th className="border border-gray-200 p-2">
                                  Store
                                </th>
                                <th className="border border-gray-200 p-2">
                                  State
                                </th>
                                <th className="border border-gray-200 p-2">
                                  NPS
                                </th>
                                <th className="border border-gray-200 p-2">
                                  Comments
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedData.slice(0, 10).map((row, idx) => (
                                <tr key={idx}>
                                  <td className="border border-gray-200 p-2">
                                    {extractDate(row) || 'N/A'}
                                  </td>
                                  <td className="border border-gray-200 p-2">
                                    {extractStore(row) || 'N/A'}
                                  </td>
                                  <td className="border border-gray-200 p-2">
                                    {extractState(row) || 'N/A'}
                                  </td>
                                  <td className="border border-gray-200 p-2">
                                    {extractScore(row) ?? 'N/A'}
                                  </td>
                                  <td className="border border-gray-200 p-2 max-w-xs truncate">
                                    {row['Comments'] ||
                                      row['Feedback'] ||
                                      'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No data to preview. Upload a CSV file first.
                      </div>
                    )}
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
