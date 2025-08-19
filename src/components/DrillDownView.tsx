import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronRight,
  MapPin,
  Store,
  Building,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  BarChart3,
  Loader2
} from 'lucide-react';
import openaiService from '@/services/openaiService';
import { toast } from 'sonner';

interface DrillDownViewProps {
  initialLevel?: 'overview' | 'state' | 'city' | 'store';
  initialIdentifier?: string;
  data?: any[];
}

export function DrillDownView({ 
  initialLevel = 'overview', 
  initialIdentifier,
  data = []
}: DrillDownViewProps) {
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  const [currentIdentifier, setCurrentIdentifier] = useState(initialIdentifier);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ level: string; name: string; id?: string }>>([
    { level: 'overview', name: 'Overview' }
  ]);
  const [insights, setInsights] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [viewData, setViewData] = useState<any>(null);

  useEffect(() => {
    loadData();
    generateInsights();
  }, [currentLevel, currentIdentifier]);

  const loadData = () => {
    // Process data based on current level
    let processedData: any = {};

    if (currentLevel === 'overview') {
      // Calculate overall metrics
      const states = [...new Set(data.map(d => d.state || d.State))].filter(Boolean);
      const stores = [...new Set(data.map(d => d.storeCode || d['Store Code']))].filter(Boolean);
      const cities = [...new Set(data.map(d => d.city || d.City))].filter(Boolean);
      
      const npsScores = data.map(d => {
        const score = d.npsScore || d['NPS Score'] || d['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'];
        return typeof score === 'number' ? score : parseInt(score || '0');
      }).filter(s => !isNaN(s));

      const promoters = npsScores.filter(s => s >= 9).length;
      const passives = npsScores.filter(s => s >= 7 && s < 9).length;
      const detractors = npsScores.filter(s => s < 7).length;
      const npsScore = Math.round(((promoters - detractors) / npsScores.length) * 100);

      processedData = {
        totalResponses: data.length,
        npsScore,
        promoters,
        passives,
        detractors,
        promoterPercent: Math.round((promoters / npsScores.length) * 100),
        detractorPercent: Math.round((detractors / npsScores.length) * 100),
        states: states.length,
        stores: stores.length,
        cities: cities.length,
        stateBreakdown: calculateBreakdown('state'),
        topStores: getTopStores(5),
        bottomStores: getBottomStores(5)
      };
    } else if (currentLevel === 'state') {
      // Filter data for specific state
      const stateData = data.filter(d => 
        (d.state || d.State) === currentIdentifier
      );
      
      const cities = [...new Set(stateData.map(d => d.city || d.City))].filter(Boolean);
      const stores = [...new Set(stateData.map(d => d.storeCode || d['Store Code']))].filter(Boolean);
      
      processedData = {
        state: currentIdentifier,
        responses: stateData.length,
        npsScore: calculateNPS(stateData),
        cities: cities.length,
        stores: stores.length,
        cityBreakdown: calculateBreakdownForState(stateData),
        storePerformance: calculateStorePerformance(stateData)
      };
    } else if (currentLevel === 'city') {
      // Filter data for specific city
      const cityData = data.filter(d => 
        (d.city || d.City) === currentIdentifier
      );
      
      processedData = {
        city: currentIdentifier,
        responses: cityData.length,
        npsScore: calculateNPS(cityData),
        stores: [...new Set(cityData.map(d => d.storeCode || d['Store Code']))].filter(Boolean),
        storeBreakdown: calculateStoreBreakdownForCity(cityData)
      };
    } else if (currentLevel === 'store') {
      // Filter data for specific store
      const storeData = data.filter(d => 
        (d.storeCode || d['Store Code']) === currentIdentifier
      );
      
      processedData = {
        storeCode: currentIdentifier,
        storeName: storeData[0]?.storeName || storeData[0]?.['Store Name'] || currentIdentifier,
        responses: storeData.length,
        npsScore: calculateNPS(storeData),
        promoters: storeData.filter(d => getNPSCategory(d) === 'promoter').length,
        detractors: storeData.filter(d => getNPSCategory(d) === 'detractor').length,
        recentFeedback: storeData.slice(-5).map(d => ({
          date: d.responseDate || d['Response Date'],
          score: getNPSScore(d),
          comment: d.comments || d.Comments || d['Any other feedback?']
        }))
      };
    }

    setViewData(processedData);
  };

  const calculateNPS = (dataSubset: any[]) => {
    const scores = dataSubset.map(d => getNPSScore(d)).filter(s => !isNaN(s));
    if (scores.length === 0) return 0;
    
    const promoters = scores.filter(s => s >= 9).length;
    const detractors = scores.filter(s => s < 7).length;
    return Math.round(((promoters - detractors) / scores.length) * 100);
  };

  const getNPSScore = (record: any): number => {
    const score = record.npsScore || 
                  record['NPS Score'] || 
                  record['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'];
    return typeof score === 'number' ? score : parseInt(score || '0');
  };

  const getNPSCategory = (record: any): string => {
    const score = getNPSScore(record);
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
  };

  const calculateBreakdown = (level: string) => {
    const groups: { [key: string]: any[] } = {};
    
    data.forEach(record => {
      let key = '';
      if (level === 'state') {
        key = record.state || record.State || 'Unknown';
      } else if (level === 'city') {
        key = record.city || record.City || 'Unknown';
      } else if (level === 'store') {
        key = record.storeCode || record['Store Code'] || 'Unknown';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    });

    return Object.entries(groups).map(([key, records]) => ({
      name: key,
      responses: records.length,
      npsScore: calculateNPS(records)
    })).sort((a, b) => b.npsScore - a.npsScore);
  };

  const calculateBreakdownForState = (stateData: any[]) => {
    const cityGroups: { [key: string]: any[] } = {};
    
    stateData.forEach(record => {
      const city = record.city || record.City || 'Unknown';
      if (!cityGroups[city]) cityGroups[city] = [];
      cityGroups[city].push(record);
    });

    return Object.entries(cityGroups).map(([city, records]) => ({
      city,
      responses: records.length,
      npsScore: calculateNPS(records),
      stores: [...new Set(records.map(r => r.storeCode || r['Store Code']))].length
    })).sort((a, b) => b.npsScore - a.npsScore);
  };

  const calculateStorePerformance = (stateData: any[]) => {
    const storeGroups: { [key: string]: any[] } = {};
    
    stateData.forEach(record => {
      const store = record.storeCode || record['Store Code'] || 'Unknown';
      if (!storeGroups[store]) storeGroups[store] = [];
      storeGroups[store].push(record);
    });

    return Object.entries(storeGroups).map(([store, records]) => ({
      storeCode: store,
      storeName: records[0]?.storeName || records[0]?.['Store Name'] || store,
      responses: records.length,
      npsScore: calculateNPS(records)
    })).sort((a, b) => b.npsScore - a.npsScore);
  };

  const calculateStoreBreakdownForCity = (cityData: any[]) => {
    const storeGroups: { [key: string]: any[] } = {};
    
    cityData.forEach(record => {
      const store = record.storeCode || record['Store Code'] || 'Unknown';
      if (!storeGroups[store]) storeGroups[store] = [];
      storeGroups[store].push(record);
    });

    return Object.entries(storeGroups).map(([store, records]) => ({
      storeCode: store,
      storeName: records[0]?.storeName || records[0]?.['Store Name'] || store,
      responses: records.length,
      npsScore: calculateNPS(records)
    })).sort((a, b) => b.npsScore - a.npsScore);
  };

  const getTopStores = (count: number) => {
    const storeGroups: { [key: string]: any[] } = {};
    
    data.forEach(record => {
      const store = record.storeCode || record['Store Code'] || 'Unknown';
      if (!storeGroups[store]) storeGroups[store] = [];
      storeGroups[store].push(record);
    });

    return Object.entries(storeGroups)
      .map(([store, records]) => ({
        storeCode: store,
        storeName: records[0]?.storeName || records[0]?.['Store Name'] || store,
        npsScore: calculateNPS(records),
        responses: records.length
      }))
      .sort((a, b) => b.npsScore - a.npsScore)
      .slice(0, count);
  };

  const getBottomStores = (count: number) => {
    const storeGroups: { [key: string]: any[] } = {};
    
    data.forEach(record => {
      const store = record.storeCode || record['Store Code'] || 'Unknown';
      if (!storeGroups[store]) storeGroups[store] = [];
      storeGroups[store].push(record);
    });

    return Object.entries(storeGroups)
      .map(([store, records]) => ({
        storeCode: store,
        storeName: records[0]?.storeName || records[0]?.['Store Name'] || store,
        npsScore: calculateNPS(records),
        responses: records.length
      }))
      .sort((a, b) => a.npsScore - b.npsScore)
      .slice(0, count);
  };

  const generateInsights = async () => {
    if (!viewData) return;
    
    setIsLoadingInsights(true);
    try {
      const response = await openaiService.generateInsights({
        type: currentLevel === 'overview' ? 'general' : currentLevel as any,
        data: viewData
      });
      
      setInsights(response);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const drillDown = (level: string, identifier: string, name: string) => {
    setCurrentLevel(level as any);
    setCurrentIdentifier(identifier);
    
    // Update breadcrumbs
    const newBreadcrumbs = [...breadcrumbs];
    const existingIndex = newBreadcrumbs.findIndex(b => b.level === level && b.id === identifier);
    
    if (existingIndex >= 0) {
      // Navigate back to existing breadcrumb
      setBreadcrumbs(newBreadcrumbs.slice(0, existingIndex + 1));
    } else {
      // Add new breadcrumb
      newBreadcrumbs.push({ level, name, id: identifier });
      setBreadcrumbs(newBreadcrumbs);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    const breadcrumb = breadcrumbs[index];
    setCurrentLevel(breadcrumb.level as any);
    setCurrentIdentifier(breadcrumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const getNPSColor = (score: number) => {
    if (score >= 50) return 'text-green-600';
    if (score >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!viewData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <Button
              variant={index === breadcrumbs.length - 1 ? "default" : "ghost"}
              size="sm"
              onClick={() => navigateToBreadcrumb(index)}
            >
              {crumb.name}
            </Button>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Data View */}
        <div className="lg:col-span-2 space-y-4">
          {currentLevel === 'overview' && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      <span className={getNPSColor(viewData.npsScore)}>
                        {viewData.npsScore}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">NPS Score</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{viewData.totalResponses}</div>
                    <p className="text-sm text-muted-foreground">Responses</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{viewData.states}</div>
                    <p className="text-sm text-muted-foreground">States</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{viewData.stores}</div>
                    <p className="text-sm text-muted-foreground">Stores</p>
                  </CardContent>
                </Card>
              </div>

              {/* State Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>State Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {viewData.stateBreakdown?.slice(0, 10).map((state: any) => (
                      <div
                        key={state.name}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => drillDown('state', state.name, state.name)}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{state.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {state.responses} responses
                          </span>
                          <Badge className={getNPSColor(state.npsScore)}>
                            NPS: {state.npsScore}
                          </Badge>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}

          {currentLevel === 'state' && viewData && (
            <>
              {/* State KPIs */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      <span className={getNPSColor(viewData.npsScore)}>
                        {viewData.npsScore}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">State NPS</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{viewData.responses}</div>
                    <p className="text-sm text-muted-foreground">Responses</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{viewData.cities}</div>
                    <p className="text-sm text-muted-foreground">Cities</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{viewData.stores}</div>
                    <p className="text-sm text-muted-foreground">Stores</p>
                  </CardContent>
                </Card>
              </div>

              {/* City Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>City Performance in {currentIdentifier}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {viewData.cityBreakdown?.map((city: any) => (
                      <div
                        key={city.city}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => drillDown('city', city.city, city.city)}
                      >
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <span>{city.city}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {city.stores} stores | {city.responses} responses
                          </span>
                          <Badge className={getNPSColor(city.npsScore)}>
                            NPS: {city.npsScore}
                          </Badge>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}

          {currentLevel === 'city' && viewData && (
            <Card>
              <CardHeader>
                <CardTitle>Store Performance in {currentIdentifier}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {viewData.storeBreakdown?.map((store: any) => (
                    <div
                      key={store.storeCode}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => drillDown('store', store.storeCode, store.storeName)}
                    >
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{store.storeName}</p>
                          <p className="text-sm text-muted-foreground">{store.storeCode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {store.responses} responses
                        </span>
                        <Badge className={getNPSColor(store.npsScore)}>
                          NPS: {store.npsScore}
                        </Badge>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {currentLevel === 'store' && viewData && (
            <Card>
              <CardHeader>
                <CardTitle>{viewData.storeName}</CardTitle>
                <p className="text-sm text-muted-foreground">Store Code: {viewData.storeCode}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold">
                        <span className={getNPSColor(viewData.npsScore)}>
                          {viewData.npsScore}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">NPS Score</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{viewData.promoters}</p>
                      <p className="text-sm text-muted-foreground">Promoters</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{viewData.detractors}</p>
                      <p className="text-sm text-muted-foreground">Detractors</p>
                    </div>
                  </div>

                  {viewData.recentFeedback && viewData.recentFeedback.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recent Feedback</h4>
                      <div className="space-y-2">
                        {viewData.recentFeedback.map((feedback: any, index: number) => (
                          <div key={index} className="p-2 border rounded">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{feedback.date}</span>
                              <Badge className={getNPSColor(feedback.score * 10)}>
                                Score: {feedback.score}
                              </Badge>
                            </div>
                            {feedback.comment && (
                              <p className="text-sm mt-1">{feedback.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Insights Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingInsights ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : insights ? (
                <div className="space-y-4">
                  {insights.insights && insights.insights.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Key Insights</h4>
                      <ul className="space-y-2">
                        {insights.insights.map((insight: string, index: number) => (
                          <li key={index} className="text-sm flex gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {insights.recommendations && insights.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <ul className="space-y-2">
                        {insights.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm flex gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {insights.alerts && insights.alerts.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Alerts</h4>
                      <ul className="space-y-2">
                        {insights.alerts.map((alert: string, index: number) => (
                          <li key={index} className="text-sm flex gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                            <span>{alert}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No insights available. Upload data to generate insights.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 