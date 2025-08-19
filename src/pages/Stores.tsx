import { useState, useEffect } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { SideNav } from "@/components/layout/SideNav";
import { GlobalFilterBar } from "@/components/GlobalFilterBar";
import CSVDataTable from "@/components/CSVDataTable";
import DataExportButton from "@/components/DataExportButton";
import { StoreDetailView } from "@/components/StoreDetailView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, TrendingUp, Users, MapPin, Star, AlertCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import authService from "@/services/authService";
import { useData } from "@/contexts/DataContext";

export default function Stores() {
  const currentUser = authService.getCurrentUser();
  const [userRole] = useState<"admin" | "user" | "store_manager">(currentUser?.role || "user");
  const [storeStats, setStoreStats] = useState<any[]>([]);
  const [selectedStoreCode, setSelectedStoreCode] = useState<string | null>(null);
  
  // Use centralized data context
  const { 
    filteredData: data, 
    aggregates, 
    isLoading,
    refreshData
  } = useData();

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  // Recalculate stats when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      calculateStoreStats(data);
    }
  }, [data]);

  // Calculate store-wise statistics
  const calculateStoreStats = (records: any[]) => {
    if (!records || records.length === 0) {
      setStoreStats([]);
      return;
    }
    
    const statsMap = new Map();
    
    records.forEach(record => {
      if (!record) return;
      
      const storeCode = record?.storeCode || record?.['Store Code'] || record?.['Store No'] || record?.['Store No.'] || 'Unknown';
      const storeName = record?.storeName || record?.['Store Name'] || record?.Description || record?.['Place Of Business'] || 'Unknown Store';
      
      if (!statsMap.has(storeCode)) {
        statsMap.set(storeCode, {
          storeCode,
          storeName,
          state: record?.state || record?.State || 'Unknown',
          city: record?.city || record?.City || 'Unknown',
          region: record?.region || record?.Region || record?.['Region Code'] || 'Unknown',
          format: record?.['Format'] || 'Standard',
          subFormat: record?.['Sub Format'] || '-',
          totalResponses: 0,
          totalScore: 0,
          promoters: 0,
          passives: 0,
          detractors: 0,
          ratings: {
            staffFriendliness: 0,
            billingExperience: 0,
            productAvailability: 0,
            storeAmbience: 0,
            trialRoom: 0,
            productVariety: 0
          },
          ratingCounts: {
            staffFriendliness: 0,
            billingExperience: 0,
            productAvailability: 0,
            storeAmbience: 0,
            trialRoom: 0,
            productVariety: 0
          }
        });
      }
      
      const stats = statsMap.get(storeCode);
      if (!stats) return;
      
      stats.totalResponses++;
      
      // NPS Score calculation - handle multiple field names
      let npsScore = 0;
      if (record?.npsScore !== undefined) {
        npsScore = parseFloat(record.npsScore);
      } else if (record?.['NPS Score'] !== undefined) {
        npsScore = parseFloat(record['NPS Score']);
      } else if (record?.nps !== undefined) {
        npsScore = parseFloat(record.nps);
      } else if (record?.['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'] !== undefined) {
        npsScore = parseFloat(record['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family']);
      }
      
      if (!isNaN(npsScore)) {
        stats.totalScore += npsScore;
        
        if (npsScore >= 9) stats.promoters++;
        else if (npsScore >= 7) stats.passives++;
        else if (npsScore <= 6) stats.detractors++;
      }
      
      // Aggregate ratings
      const addRating = (key: string, value: any) => {
        if (value !== undefined && value !== null && value !== '') {
          const rating = parseFloat(value);
          if (!isNaN(rating)) {
            stats.ratings[key] += rating;
            stats.ratingCounts[key]++;
          }
        }
      };
      
      addRating('staffFriendliness', record['Please rate us on the following - Staff Friendliness & Service']);
      addRating('billingExperience', record['Please rate us on the following - Billing Experience']);
      addRating('productAvailability', record['Please rate us on the following - Product Size availability']);
      addRating('storeAmbience', record['Please rate us on the following - Store Ambience']);
      addRating('trialRoom', record['Please rate us on the following - Trial Room Experience']);
      addRating('productVariety', record['Please rate us on the following - Product Options/ Variety']);
    });
    
    const storeStatsArray = Array.from(statsMap.values()).map(stats => {
      // Calculate averages
      const avgRatings: any = {};
      Object.keys(stats.ratings).forEach(key => {
        avgRatings[key] = stats.ratingCounts[key] > 0 
          ? (stats.ratings[key] / stats.ratingCounts[key]).toFixed(1)
          : '0';
      });
      
      // Calculate key KPIs used by the UI
      const avgScore = stats.totalResponses > 0 
        ? (stats.totalScore / stats.totalResponses)
        : 0;
      const detractorRate = stats.totalResponses > 0
        ? (stats.detractors / stats.totalResponses) * 100
        : 0;
      const nps = stats.totalResponses > 0
        ? Math.round(((stats.promoters - stats.detractors) / stats.totalResponses) * 100)
        : 0;

      return {
        ...stats,
        // Keep string fields for places where strings are displayed
        averageNPS: avgScore.toFixed(1),
        npsScore: stats.totalResponses > 0 
          ? (((stats.promoters - stats.detractors) / stats.totalResponses) * 100).toFixed(1)
          : '0',
        // Add numeric fields used by table rendering
        avgScore,
        detractorRate,
        nps,
        avgRatings
      };
    });
    
    // Sort by total responses
    storeStatsArray.sort((a, b) => b.totalResponses - a.totalResponses);
    
    setStoreStats(storeStatsArray);
  };



  const getNPSBadge = (score: number) => {
    if (score > 0) return <Badge className="bg-green-100 text-green-800">Positive</Badge>;
    if (score < 0) return <Badge className="bg-red-100 text-red-800">Negative</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Neutral</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar userRole={userRole} onLogout={handleLogout} />
      
      <div className="flex">
        <SideNav userRole={userRole} />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Store Performance</h1>
            <p className="text-muted-foreground">
              Detailed NPS analysis by store location
            </p>
          </div>

          {/* Use GlobalFilterBar instead of UniversalFilterBar */}
          <GlobalFilterBar />

          {/* Store Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storeStats.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active stores with responses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across all stores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average NPS</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aggregates?.npsScore?.toFixed(1) || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Store</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {storeStats[0]?.storeCode || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {storeStats[0]?.totalResponses || 0} responses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Stores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Performing Stores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {storeStats
                    .filter(store => parseFloat(store.npsScore) > 0)
                    .slice(0, 5)
                    .map((store, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{store.storeCode}</p>
                          <p className="text-sm text-muted-foreground">
                            {store.storeName} • {store.city}, {store.state}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {store.npsScore}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {store.totalResponses} responses
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Stores Needing Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {storeStats
                    .filter(store => parseFloat(store.npsScore) < 0)
                    .slice(0, 5)
                    .map((store, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{store.storeCode}</p>
                          <p className="text-sm text-muted-foreground">
                            {store.storeName} • {store.city}, {store.state}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">
                            {store.npsScore}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {store.totalResponses} responses
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Store Statistics Table */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Performance Ranking
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Store</th>
                      <th className="px-4 py-3 text-left font-medium">Location</th>
                      <th className="px-4 py-3 text-center font-medium">NPS Score</th>
                      <th className="px-4 py-3 text-center font-medium">Responses</th>
                      <th className="px-4 py-3 text-center font-medium">Avg Score</th>
                      <th className="px-4 py-3 text-center font-medium">Detractor Rate</th>
                      <th className="px-4 py-3 text-center font-medium">Status</th>
                      <th className="px-4 py-3 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeStats.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                          No store data available. Please upload CSV data to see store performance.
                        </td>
                      </tr>
                    ) : (
                      storeStats.slice(0, 10).map((stat, index) => (
                        <tr key={stat.storeCode} className="border-t hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{stat.storeName}</p>
                              <p className="text-sm text-muted-foreground">{stat.storeCode}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{stat.city}, {stat.state}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-lg font-bold ${
                              stat.nps >= 50 ? 'text-green-600' : 
                              stat.nps >= 0 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {stat.nps}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">{stat.totalResponses}</td>
                          <td className="px-4 py-3 text-center">{stat.avgScore.toFixed(1)}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={stat.detractorRate > 30 ? "destructive" : "secondary"}>
                              {stat.detractorRate.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getNPSBadge(stat.nps)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedStoreCode(stat.storeCode)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Data Table */}
          <CSVDataTable 
            data={data}
            title="Store-wise NPS Records"
            columns={[
              'storeCode',
              'storeName',
              'state',
              'city',
              'responseDate',
              'npsScore',
              'npsCategory',
              'comments'
            ]}
            pageSize={50}
          />
        </main>
      </div>
      
      {/* Store Detail View Dialog */}
      {selectedStoreCode && (
        <StoreDetailView
          storeCode={selectedStoreCode}
          open={!!selectedStoreCode}
          onClose={() => setSelectedStoreCode(null)}
          data={data}
        />
      )}
    </div>
  );
}