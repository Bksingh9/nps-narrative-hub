import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, TrendingUp, TrendingDown, Users, Store,
  MessageSquare, Calendar, Star, AlertTriangle,
  ChevronRight, Building2, Activity, BarChart3
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from "recharts";

interface StateDetails {
  stateName: string;
  totalStores: number;
  totalCities: number;
  region?: string;
  topCity?: string;
  bottomCity?: string;
}

interface StateNPSMetrics {
  currentNPS: number;
  previousNPS: number;
  trend: 'improving' | 'declining' | 'stable';
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
  avgScore: number;
  monthlyTrend: Array<{ month: string; nps: number; responses: number }>;
  cityPerformance: Array<{ city: string; nps: number; responses: number; stores: number }>;
  storeRanking: Array<{ 
    storeCode: string; 
    storeName: string; 
    city: string; 
    nps: number; 
    responses: number 
  }>;
}

interface StateDetailViewProps {
  stateName: string;
  open: boolean;
  onClose: () => void;
  data?: any[];
}

export function StateDetailView({ stateName, open, onClose, data = [] }: StateDetailViewProps) {
  const [stateDetails, setStateDetails] = useState<StateDetails | null>(null);
  const [npsMetrics, setNPSMetrics] = useState<StateNPSMetrics | null>(null);
  const [comments, setComments] = useState<Array<{ 
    text: string; 
    score: number; 
    date: string; 
    store: string;
    city: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && stateName) {
      analyzeStateData();
    }
  }, [open, stateName, data]);

  const analyzeStateData = () => {
    setIsLoading(true);
    
    try {
      // Filter data for this state
      const stateData = data.filter(record => {
        const recordState = record.state || record.State;
        return recordState === stateName;
      });

      if (stateData.length === 0) {
        setIsLoading(false);
        return;
      }

      // Extract unique cities and stores
      const citiesMap = new Map<string, any[]>();
      const storesMap = new Map<string, any[]>();
      
      stateData.forEach(record => {
        const city = record.city || record.City || 'Unknown';
        const storeCode = record.storeCode || record['Store Code'] || record['Store No'];
        
        if (!citiesMap.has(city)) {
          citiesMap.set(city, []);
        }
        citiesMap.get(city)?.push(record);
        
        if (storeCode) {
          if (!storesMap.has(storeCode)) {
            storesMap.set(storeCode, []);
          }
          storesMap.get(storeCode)?.push(record);
        }
      });

      // Calculate city performance
      const cityPerformance = Array.from(citiesMap.entries()).map(([city, records]) => {
        const scores = records.map(r => {
          const score = r.npsScore ?? r['NPS Score'] ?? r.nps ?? 
                       r['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'];
          return typeof score === 'number' ? score : parseFloat(String(score || '').trim());
        }).filter(s => !isNaN(s) && s >= 0 && s <= 10);
        
        const promoters = scores.filter(s => s >= 9).length;
        const detractors = scores.filter(s => s <= 6).length;
        const nps = scores.length > 0 ? Math.round(((promoters - detractors) / scores.length) * 100) : 0;
        
        // Count unique stores in this city
        const cityStores = new Set(records.map(r => 
          r.storeCode || r['Store Code'] || r['Store No']
        ).filter(Boolean)).size;
        
        return {
          city,
          nps,
          responses: scores.length,
          stores: cityStores
        };
      }).sort((a, b) => b.nps - a.nps);

      // Calculate store ranking
      const storeRanking = Array.from(storesMap.entries()).map(([storeCode, records]) => {
        const scores = records.map(r => {
          const score = r.npsScore ?? r['NPS Score'] ?? r.nps ?? 
                       r['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'];
          return typeof score === 'number' ? score : parseFloat(String(score || '').trim());
        }).filter(s => !isNaN(s) && s >= 0 && s <= 10);
        
        const promoters = scores.filter(s => s >= 9).length;
        const detractors = scores.filter(s => s <= 6).length;
        const nps = scores.length > 0 ? Math.round(((promoters - detractors) / scores.length) * 100) : 0;
        
        return {
          storeCode,
          storeName: records[0].storeName || records[0]['Store Name'] || records[0].Description || storeCode,
          city: records[0].city || records[0].City || 'Unknown',
          nps,
          responses: scores.length
        };
      }).sort((a, b) => b.nps - a.nps);

      // State details
      const details: StateDetails = {
        stateName,
        totalStores: storesMap.size,
        totalCities: citiesMap.size,
        region: stateData[0].region || stateData[0].Region,
        topCity: cityPerformance[0]?.city,
        bottomCity: cityPerformance[cityPerformance.length - 1]?.city
      };
      setStateDetails(details);

      // Calculate overall NPS metrics
      const scores = stateData.map(r => {
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
      stateData.forEach(record => {
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
        .map(([month, monthScores]) => {
          const monthPromoters = monthScores.filter(s => s >= 9).length;
          const monthDetractors = monthScores.filter(s => s <= 6).length;
          const monthNPS = Math.round(((monthPromoters - monthDetractors) / monthScores.length) * 100);
          
          return {
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            nps: monthNPS,
            responses: monthScores.length
          };
        })
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6); // Last 6 months

      const previousNPS = monthlyTrend.length >= 2 ? monthlyTrend[monthlyTrend.length - 2].nps : currentNPS;
      const trend = currentNPS > previousNPS ? 'improving' : currentNPS < previousNPS ? 'declining' : 'stable';

      const metrics: StateNPSMetrics = {
        currentNPS,
        previousNPS,
        trend,
        promoters,
        passives,
        detractors,
        totalResponses: scores.length,
        avgScore,
        monthlyTrend,
        cityPerformance,
        storeRanking: storeRanking.slice(0, 10) // Top 10 stores
      };
      setNPSMetrics(metrics);

      // Extract comments with store and city info
      const extractedComments = stateData
        .map(record => ({
          text: record.comments || record.Comments || record['Any other feedback?'] || '',
          score: record.npsScore ?? record['NPS Score'] ?? record.nps ?? 0,
          date: record.responseDate || record['Response Date'] || new Date().toISOString(),
          store: record.storeName || record['Store Name'] || record.storeCode || 'Unknown',
          city: record.city || record.City || 'Unknown'
        }))
        .filter(c => c.text && c.text.trim())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);
      
      setComments(extractedComments);
    } catch (error) {
      console.error('Error analyzing state data:', error);
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
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            State Analysis: {stateName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : stateDetails && npsMetrics ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="cities">Cities</TabsTrigger>
              <TabsTrigger value="stores">Top Stores</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* State Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">State NPS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" style={{ color: getNPSColor(npsMetrics.currentNPS) }}>
                      {npsMetrics.currentNPS}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {npsMetrics.trend === 'improving' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : npsMetrics.trend === 'declining' ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {Math.abs(npsMetrics.currentNPS - npsMetrics.previousNPS)} pts from last period
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Cities</span>
                        <span className="font-medium">{stateDetails.totalCities}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Stores</span>
                        <span className="font-medium">{stateDetails.totalStores}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Responses</span>
                        <span className="font-medium">{npsMetrics.totalResponses}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Top City</span>
                        <Badge variant="default" className="text-xs">
                          {stateDetails.topCity}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bottom City</span>
                        <Badge variant="destructive" className="text-xs">
                          {stateDetails.bottomCity}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Avg Score</span>
                        <span className="font-medium">{npsMetrics.avgScore.toFixed(1)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Response Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={250}>
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
                    
                    <div className="flex flex-col justify-center space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          Promoters (9-10)
                        </span>
                        <div className="text-right">
                          <p className="font-bold text-lg">{npsMetrics.promoters}</p>
                          <p className="text-xs text-muted-foreground">
                            {((npsMetrics.promoters / npsMetrics.totalResponses) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-500 rounded"></div>
                          Passives (7-8)
                        </span>
                        <div className="text-right">
                          <p className="font-bold text-lg">{npsMetrics.passives}</p>
                          <p className="text-xs text-muted-foreground">
                            {((npsMetrics.passives / npsMetrics.totalResponses) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          Detractors (0-6)
                        </span>
                        <div className="text-right">
                          <p className="font-bold text-lg">{npsMetrics.detractors}</p>
                          <p className="text-xs text-muted-foreground">
                            {((npsMetrics.detractors / npsMetrics.totalResponses) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cities" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>City-wise Performance</CardTitle>
                  <CardDescription>NPS scores across all cities in {stateName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={npsMetrics.cityPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="city" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="nps" fill="#8884d8" name="NPS Score" />
                      <Bar dataKey="responses" fill="#82ca9d" name="Responses" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left">City</th>
                          <th className="px-4 py-2 text-center">NPS Score</th>
                          <th className="px-4 py-2 text-center">Responses</th>
                          <th className="px-4 py-2 text-center">Stores</th>
                        </tr>
                      </thead>
                      <tbody>
                        {npsMetrics.cityPerformance.map((city, index) => (
                          <tr key={city.city} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-2 font-medium">{city.city}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`font-bold ${
                                city.nps >= 50 ? 'text-green-600' : 
                                city.nps >= 0 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {city.nps}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center">{city.responses}</td>
                            <td className="px-4 py-2 text-center">{city.stores}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stores" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Stores</CardTitle>
                  <CardDescription>Best stores in {stateName} by NPS score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left">Rank</th>
                          <th className="px-4 py-3 text-left">Store</th>
                          <th className="px-4 py-3 text-left">City</th>
                          <th className="px-4 py-3 text-center">NPS Score</th>
                          <th className="px-4 py-3 text-center">Responses</th>
                        </tr>
                      </thead>
                      <tbody>
                        {npsMetrics.storeRanking.map((store, index) => (
                          <tr key={store.storeCode} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <Badge variant={index < 3 ? "default" : "secondary"}>
                                #{index + 1}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{store.storeName}</p>
                                <p className="text-xs text-muted-foreground">{store.storeCode}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">{store.city}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-lg font-bold ${
                                store.nps >= 50 ? 'text-green-600' : 
                                store.nps >= 0 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {store.nps}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">{store.responses}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>NPS Trend Analysis</CardTitle>
                  <CardDescription>6-month NPS trend for {stateName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={npsMetrics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="nps" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                        name="NPS Score"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="responses" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        dot={{ fill: '#82ca9d' }}
                        name="Responses"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Recent Customer Feedback
                  </CardTitle>
                  <CardDescription>Latest comments from customers in {stateName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {comments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No feedback comments available
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((comment, i) => (
                          <div key={i} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
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
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Store className="w-3 h-3" />
                                  {comment.store}
                                  <MapPin className="w-3 h-3 ml-2" />
                                  {comment.city}
                                </div>
                              </div>
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
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No data available for this state</p>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => window.print()}>
            Print Report
          </Button>
          <Button onClick={() => {
            // Export functionality
            const exportData = {
              stateDetails,
              npsMetrics,
              comments
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `state-${stateName}-report.json`;
            a.click();
          }}>
            Export Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 