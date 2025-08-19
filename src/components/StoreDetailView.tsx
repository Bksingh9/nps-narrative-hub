import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Store, MapPin, TrendingUp, TrendingDown, Users, 
  MessageSquare, Calendar, Star, AlertTriangle,
  ChevronRight, Mail, Phone, Globe
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface StoreDetails {
  storeCode: string;
  storeName: string;
  state: string;
  city: string;
  region?: string;
  manager?: string;
  email?: string;
  phone?: string;
}

interface NPSMetrics {
  currentNPS: number;
  previousNPS: number;
  trend: 'improving' | 'declining' | 'stable';
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
  avgScore: number;
  monthlyTrend: Array<{ month: string; nps: number; responses: number }>;
}

interface StoreDetailViewProps {
  storeCode: string;
  open: boolean;
  onClose: () => void;
  data?: any[];
}

export function StoreDetailView({ storeCode, open, onClose, data = [] }: StoreDetailViewProps) {
  const [storeDetails, setStoreDetails] = useState<StoreDetails | null>(null);
  const [npsMetrics, setNPSMetrics] = useState<NPSMetrics | null>(null);
  const [comments, setComments] = useState<Array<{ text: string; score: number; date: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && storeCode) {
      analyzeStoreData();
    }
  }, [open, storeCode, data]);

  const analyzeStoreData = () => {
    setIsLoading(true);
    
    try {
      // Filter data for this store
      const storeData = data.filter(record => {
        const recordStoreCode = record.storeCode || record['Store Code'] || record['Store No'];
        return recordStoreCode === storeCode;
      });

      if (storeData.length === 0) {
        setIsLoading(false);
        return;
      }

      // Extract store details
      const firstRecord = storeData[0];
      const details: StoreDetails = {
        storeCode,
        storeName: firstRecord.storeName || firstRecord['Store Name'] || firstRecord.Description || storeCode,
        state: firstRecord.state || firstRecord.State || 'Unknown',
        city: firstRecord.city || firstRecord.City || 'Unknown',
        region: firstRecord.region || firstRecord.Region,
        manager: firstRecord.manager || 'Not Available',
        email: firstRecord.email || 'store@trends.com',
        phone: firstRecord.phone || '1-800-TRENDS'
      };
      setStoreDetails(details);

      // Calculate NPS metrics
      const scores = storeData.map(r => {
        const score = r.npsScore ?? r['NPS Score'] ?? r.nps ?? 
                     r['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'];
        return typeof score === 'number' ? score : parseFloat(String(score || '').trim());
      }).filter(s => !isNaN(s) && s >= 0 && s <= 10);

      const promoters = scores.filter(s => s >= 9).length;
      const passives = scores.filter(s => s >= 7 && s < 9).length;
      const detractors = scores.filter(s => s <= 6).length;
      const currentNPS = scores.length > 0 ? Math.round(((promoters - detractors) / scores.length) * 100) : 0;
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      // Group by month for trend
      const monthlyData = new Map<string, number[]>();
      storeData.forEach(record => {
        const date = new Date(record.responseDate || record['Response Date'] || record.Date || new Date());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const score = record.npsScore ?? record['NPS Score'] ?? record.nps ?? 
                     record['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'];
        const numScore = typeof score === 'number' ? score : parseFloat(String(score || '').trim());
        
        if (!isNaN(numScore)) {
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, []);
          }
          monthlyData.get(monthKey)?.push(numScore);
        }
      });

      const monthlyTrend = Array.from(monthlyData.entries())
        .map(([month, scores]) => {
          const monthPromoters = scores.filter(s => s >= 9).length;
          const monthDetractors = scores.filter(s => s <= 6).length;
          const monthNPS = Math.round(((monthPromoters - monthDetractors) / scores.length) * 100);
          
          return {
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            nps: monthNPS,
            responses: scores.length
          };
        })
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6); // Last 6 months

      const previousNPS = monthlyTrend.length >= 2 ? monthlyTrend[monthlyTrend.length - 2].nps : currentNPS;
      const trend = currentNPS > previousNPS ? 'improving' : currentNPS < previousNPS ? 'declining' : 'stable';

      const metrics: NPSMetrics = {
        currentNPS,
        previousNPS,
        trend,
        promoters,
        passives,
        detractors,
        totalResponses: scores.length,
        avgScore,
        monthlyTrend
      };
      setNPSMetrics(metrics);

      // Extract comments
      const extractedComments = storeData
        .map(record => ({
          text: record.comments || record.Comments || record['Any other feedback?'] || '',
          score: record.npsScore ?? record['NPS Score'] ?? record.nps ?? 0,
          date: record.responseDate || record['Response Date'] || new Date().toISOString()
        }))
        .filter(c => c.text && c.text.trim())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      
      setComments(extractedComments);
    } catch (error) {
      console.error('Error analyzing store data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNPSColor = (nps: number) => {
    if (nps >= 50) return '#10b981';
    if (nps >= 0) return '#f59e0b';
    return '#ef4444';
  };

  const pieData = npsMetrics ? [
    { name: 'Promoters', value: npsMetrics.promoters, color: '#10b981' },
    { name: 'Passives', value: npsMetrics.passives, color: '#6b7280' },
    { name: 'Detractors', value: npsMetrics.detractors, color: '#ef4444' }
  ] : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-6 h-6" />
            Store Details: {storeDetails?.storeName || storeCode}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : storeDetails && npsMetrics ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Store Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Store Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {storeDetails.city}, {storeDetails.state}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Region</p>
                    <p className="font-medium">{storeDetails.region || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Store Code</p>
                    <p className="font-medium">{storeDetails.storeCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Manager</p>
                    <p className="font-medium">{storeDetails.manager}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Current NPS Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">NPS Score</p>
                      <p className="text-4xl font-bold" style={{ color: getNPSColor(npsMetrics.currentNPS) }}>
                        {npsMetrics.currentNPS}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {npsMetrics.trend === 'improving' ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : npsMetrics.trend === 'declining' ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm">
                          {Math.abs(npsMetrics.currentNPS - npsMetrics.previousNPS)} points from last period
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Responses</p>
                      <p className="text-2xl font-bold">{npsMetrics.totalResponses}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Avg Score: {npsMetrics.avgScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              {/* NPS Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>NPS Trend (Last 6 Months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={npsMetrics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="nps" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Response Distribution */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Response Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        Promoters (9-10)
                      </span>
                      <Badge variant="secondary">{npsMetrics.promoters}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-500 rounded"></div>
                        Passives (7-8)
                      </span>
                      <Badge variant="secondary">{npsMetrics.passives}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        Detractors (0-6)
                      </span>
                      <Badge variant="secondary">{npsMetrics.detractors}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Recent Customer Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {comments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No feedback comments available
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((comment, i) => (
                          <div key={i} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant={
                                comment.score >= 9 ? 'default' : 
                                comment.score >= 7 ? 'secondary' : 
                                'destructive'
                              }>
                                Score: {comment.score}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Store Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Store Name</p>
                      <p className="font-medium">{storeDetails.storeName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Store Manager</p>
                      <p className="font-medium">{storeDetails.manager}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{storeDetails.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{storeDetails.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Full Address</p>
                      <p className="font-medium">
                        {storeDetails.city}, {storeDetails.state}
                        {storeDetails.region && ` - ${storeDetails.region} Region`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                  Print Report
                </Button>
                <Button onClick={() => {
                  // Export functionality
                  const exportData = {
                    storeDetails,
                    npsMetrics,
                    comments
                  };
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `store-${storeCode}-report.json`;
                  a.click();
                }}>
                  Export Data
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No data available for this store</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 