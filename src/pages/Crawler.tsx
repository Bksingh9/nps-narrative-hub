import { useState, useEffect } from 'react';
import { Bot, Globe, Loader2, CheckCircle, XCircle, AlertCircle, Download, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SideNav } from '@/components/layout/SideNav';
import { HeaderBar } from '@/components/layout/HeaderBar';
import crawlerApi, { CrawlTemplate, JobStatus } from '@/services/crawlerApi';

export default function Crawler() {
  const [userRole] = useState<'admin' | 'user' | 'store_manager'>('admin');
  const [url, setUrl] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState<CrawlTemplate[]>([]);
  const [customSelectors, setCustomSelectors] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [batchUrls, setBatchUrls] = useState('');
  const { toast } = useToast();

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Load templates when backend is online
  useEffect(() => {
    if (backendStatus === 'online') {
      loadTemplates();
    }
  }, [backendStatus]);

  const checkBackendHealth = async () => {
    const isHealthy = await crawlerApi.checkHealth();
    setBackendStatus(isHealthy ? 'online' : 'offline');
  };

  const loadTemplates = async () => {
    try {
      const data = await crawlerApi.getTemplates();
      setTemplates(data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleSingleCrawl = async () => {
    if (!url) {
      toast({
        title: 'Error',
        description: 'Please enter a URL to crawl',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setJobStatus(null);

    try {
      const job = {
        url,
        template: selectedTemplate || undefined,
        customSelectors: customSelectors ? JSON.parse(customSelectors) : undefined,
      };

      const response = await crawlerApi.crawlSingle(job);
      
      toast({
        title: 'Crawl Started',
        description: `Job ID: ${response.jobId}`,
      });

      // Poll for job status
      if (response.jobId) {
        const status = await crawlerApi.pollJobStatus(response.jobId);
        setJobStatus(status);

        if (status.status === 'completed' && status.npsData) {
          crawlerApi.importToLocalStorage(status.npsData);
          toast({
            title: 'Data Imported',
            description: `Successfully imported ${status.npsData.length} records`,
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Crawl Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchCrawl = async () => {
    const urls = batchUrls.split('\n').filter(u => u.trim());
    
    if (urls.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter at least one URL',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const jobs = urls.map(url => ({
        url: url.trim(),
        template: selectedTemplate || undefined,
      }));

      const response = await crawlerApi.crawlBatch(jobs);
      
      toast({
        title: 'Batch Crawl Started',
        description: `Processing ${urls.length} URLs`,
      });

    } catch (error: any) {
      toast({
        title: 'Batch Crawl Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCrawl = async () => {
    if (!url) {
      toast({
        title: 'Error',
        description: 'Please enter a URL to test',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await crawlerApi.testCrawler({
        url,
        template: selectedTemplate || undefined,
        customSelectors: customSelectors ? JSON.parse(customSelectors) : undefined,
      });

      console.log('Test result:', result);
      
      toast({
        title: 'Test Complete',
        description: `Found ${result.recordsFound} records`,
      });

      setJobStatus({
        status: 'completed',
        npsData: result.transformedData,
        result: result.rawData,
      });

    } catch (error: any) {
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('Logout');
  };

  return (
    <div className="flex h-screen bg-background">
      <SideNav userRole={userRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderBar userRole={userRole} onLogout={handleLogout} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Backend Status Alert */}
            {backendStatus === 'offline' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Backend Offline</AlertTitle>
                <AlertDescription>
                  The crawler backend is not running. Please start it with: cd backend && npm run dev
                </AlertDescription>
              </Alert>
            )}

            {backendStatus === 'online' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Backend Online</AlertTitle>
                <AlertDescription>
                  Crawler backend is running and ready to process requests.
                </AlertDescription>
              </Alert>
            )}

            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle>Web Crawler</CardTitle>
                      <CardDescription>
                        Extract NPS data from websites and online platforms
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Globe className="h-3 w-3" />
                    {backendStatus === 'online' ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Crawler Interface */}
            <Tabs defaultValue="single" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="single">Single URL</TabsTrigger>
                <TabsTrigger value="batch">Batch URLs</TabsTrigger>
                <TabsTrigger value="csv">CSV Files</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Crawl Single URL</CardTitle>
                    <CardDescription>
                      Extract NPS data from a specific webpage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">URL to Crawl</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com/reviews"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={backendStatus !== 'online'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template">Template (Optional)</Label>
                      <Select
                        value={selectedTemplate}
                        onValueChange={setSelectedTemplate}
                        disabled={backendStatus !== 'online'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template or use custom selectors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Template</SelectItem>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {!selectedTemplate && (
                      <div className="space-y-2">
                        <Label htmlFor="selectors">Custom Selectors (JSON)</Label>
                        <Textarea
                          id="selectors"
                          placeholder='{"npsScore": ".rating", "reviews": ".review-text"}'
                          value={customSelectors}
                          onChange={(e) => setCustomSelectors(e.target.value)}
                          className="font-mono text-sm"
                          rows={4}
                          disabled={backendStatus !== 'online'}
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSingleCrawl}
                        disabled={isLoading || backendStatus !== 'online'}
                        className="flex-1"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Crawling...
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            Start Crawl
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleTestCrawl}
                        disabled={isLoading || backendStatus !== 'online'}
                      >
                        Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Job Status */}
                {jobStatus && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {jobStatus.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
                        {jobStatus.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {jobStatus.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                        Job Status: {jobStatus.status}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {jobStatus.npsData && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Found {jobStatus.npsData.length} records
                          </p>
                          {jobStatus.npsData.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                crawlerApi.importToLocalStorage(jobStatus.npsData!);
                                toast({
                                  title: 'Data Imported',
                                  description: `Successfully imported ${jobStatus.npsData!.length} records`,
                                });
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Import to Dashboard
                            </Button>
                          )}
                        </div>
                      )}
                      {jobStatus.error && (
                        <Alert variant="destructive">
                          <AlertDescription>{jobStatus.error}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="batch" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Batch URL Crawling</CardTitle>
                    <CardDescription>
                      Crawl multiple URLs at once (one URL per line)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="batch-urls">URLs (one per line)</Label>
                      <Textarea
                        id="batch-urls"
                        placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                        value={batchUrls}
                        onChange={(e) => setBatchUrls(e.target.value)}
                        rows={8}
                        disabled={backendStatus !== 'online'}
                      />
                    </div>

                    <Button
                      onClick={handleBatchCrawl}
                      disabled={isLoading || backendStatus !== 'online'}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Batch...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Start Batch Crawl
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="csv" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>CSV Data Processing</CardTitle>
                    <CardDescription>
                      Extract and process NPS data from CSV files
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="csv-file">Upload CSV File</Label>
                      <Input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsLoading(true);
                            try {
                              const result = await crawlerApi.processCSV(file);
                              if (result.success && result.data) {
                                crawlerApi.importToLocalStorage(result.data);
                                toast({
                                  title: 'CSV Processed',
                                  description: `Successfully imported ${result.totalRecords} records`,
                                });
                              }
                            } catch (error: any) {
                              toast({
                                title: 'CSV Processing Failed',
                                description: error.message,
                                variant: 'destructive',
                              });
                            } finally {
                              setIsLoading(false);
                            }
                          }
                        }}
                        disabled={backendStatus !== 'online' || isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="csv-url">Or Process CSV from URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="csv-url"
                          type="url"
                          placeholder="https://example.com/data.csv"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          disabled={backendStatus !== 'online'}
                        />
                        <Button
                          onClick={async () => {
                            if (!url) {
                              toast({
                                title: 'Error',
                                description: 'Please enter a CSV URL',
                                variant: 'destructive',
                              });
                              return;
                            }
                            
                            setIsLoading(true);
                            try {
                              const result = await crawlerApi.processCSVFromURL(url);
                              if (result.success && result.data) {
                                crawlerApi.importToLocalStorage(result.data);
                                toast({
                                  title: 'CSV Processed',
                                  description: `Successfully imported ${result.totalRecords} records from URL`,
                                });
                              }
                            } catch (error: any) {
                              toast({
                                title: 'CSV URL Processing Failed',
                                description: error.message,
                                variant: 'destructive',
                              });
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          disabled={isLoading || backendStatus !== 'online'}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Process URL
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>CSV Format</AlertTitle>
                      <AlertDescription>
                        The CSV processor automatically detects common column headers like:
                        Store No, State, Region, City, NPS Score, Response Date, Comments, etc.
                        Data is normalized and imported directly to your dashboard.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="templates" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Templates</CardTitle>
                    <CardDescription>
                      Pre-configured templates for popular platforms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {templates.map((template) => (
                        <Card key={template.id}>
                          <CardHeader>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Badge variant="outline">
                              {template.usePuppeteer ? 'Dynamic' : 'Static'}
                            </Badge>
                          </CardHeader>
                          <CardContent>
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                              {JSON.stringify(template.selectors, null, 2)}
                            </pre>
                          </CardContent>
                        </Card>
                      ))}
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