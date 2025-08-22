import { useState, useEffect } from 'react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { SideNav } from '@/components/layout/SideNav';
import { GlobalFilterBar } from '@/components/GlobalFilterBar';
import CSVDataTable from '@/components/CSVDataTable';
import DataExportButton from '@/components/DataExportButton';
import { StateDetailView } from '@/components/StateDetailView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  TrendingUp,
  Users,
  Star,
  Eye,
  Building2,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import authService from '@/services/authService';
import { useData } from '@/contexts/DataContext';

export default function States() {
  const currentUser = authService.getCurrentUser();
  const [userRole] = useState<'admin' | 'user' | 'store_manager'>(
    currentUser?.role || 'user'
  );
  const [stateStats, setStateStats] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Use centralized data context
  const { filteredData: data, aggregates, isLoading, refreshData } = useData();

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  // Load initial data and calculate stats
  useEffect(() => {
    refreshData();
  }, []);

  // Recalculate stats when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      calculateStateStats(data);
    }
  }, [data]);

  // Calculate state-wise statistics
  const calculateStateStats = (records: any[]) => {
    if (!records || records.length === 0) {
      setStateStats([]);
      return;
    }

    const statsMap = new Map();

    records.forEach(record => {
      // Get state from various possible field names
      const state =
        record?.state || record?.State || record?.STATE || 'Unknown';

      if (!statsMap.has(state)) {
        statsMap.set(state, {
          state,
          totalResponses: 0,
          totalScore: 0,
          promoters: 0,
          passives: 0,
          detractors: 0,
          stores: new Set(),
          cities: new Set(),
        });
      }

      const stats = statsMap.get(state);
      if (!stats) return;

      stats.totalResponses++;

      // Get NPS score from various possible field names
      let npsScore = 0;
      if (record?.npsScore !== undefined) {
        npsScore = parseFloat(record.npsScore);
      } else if (record?.['NPS Score'] !== undefined) {
        npsScore = parseFloat(record['NPS Score']);
      } else if (record?.nps !== undefined) {
        npsScore = parseFloat(record.nps);
      } else if (
        record?.[
          'On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'
        ] !== undefined
      ) {
        npsScore = parseFloat(
          record[
            'On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'
          ]
        );
      }

      if (!isNaN(npsScore)) {
        stats.totalScore += npsScore;

        if (npsScore >= 9) stats.promoters++;
        else if (npsScore >= 7) stats.passives++;
        else if (npsScore <= 6) stats.detractors++;
      }

      // Store and city from various field names
      const storeCode =
        record?.storeCode ||
        record?.['Store Code'] ||
        record?.['Store No'] ||
        record?.['Store No.'];
      const city = record?.city || record?.City || record?.CITY;

      if (storeCode) stats.stores.add(storeCode);
      if (city) stats.cities.add(city);
    });

    const stateStatsArray = Array.from(statsMap.values()).map(stats => {
      const nps =
        stats.totalResponses > 0
          ? Math.round(
              ((stats.promoters - stats.detractors) / stats.totalResponses) *
                100
            )
          : 0;

      const avgScore =
        stats.totalResponses > 0 ? stats.totalScore / stats.totalResponses : 0;

      const detractorRate =
        stats.totalResponses > 0
          ? (stats.detractors / stats.totalResponses) * 100
          : 0;

      return {
        state: stats.state,
        totalResponses: stats.totalResponses,
        totalStores: stats.stores.size,
        totalCities: stats.cities.size,
        nps: nps,
        avgScore: avgScore,
        detractorRate: detractorRate,
        promoters: stats.promoters,
        passives: stats.passives,
        detractors: stats.detractors,
      };
    });

    // Sort by total responses
    stateStatsArray.sort((a, b) => b.totalResponses - a.totalResponses);

    setStateStats(stateStatsArray);
  };

  // Remove this handler since GlobalFilterBar uses DataContext directly

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar userRole={userRole} onLogout={handleLogout} />

      <div className="flex">
        <SideNav userRole={userRole} />

        <main className="flex-1 p-6 pr-0 space-y-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h1 className="text-3xl font-bold">State Analysis</h1>
              <p className="text-muted-foreground">
                View and analyze NPS data by state from your CSV file
              </p>
            </div>
            <DataExportButton
              data={data}
              filename="states-nps-data"
              showFormats={userRole === 'admin'}
            />
          </div>

          {/* Global Filters */}
          <GlobalFilterBar />

          {/* State Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total States
                </CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stateStats.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active states with responses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Responses
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across all states
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average NPS
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aggregates?.npsScore?.toFixed(1) || '0'}
                </div>
                <p className="text-xs text-muted-foreground">Overall score</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top State</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stateStats[0]?.state || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stateStats[0]?.totalResponses || 0} responses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* State Statistics Table */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                State-wise NPS Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">State</th>
                      <th className="px-4 py-3 text-center font-medium">
                        NPS Score
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Cities
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Stores
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Responses
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Avg Score
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Detractor %
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stateStats.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No state data available. Please upload CSV data to see
                          state performance.
                        </td>
                      </tr>
                    ) : (
                      stateStats.map((stat, index) => (
                        <tr
                          key={stat.state}
                          className="border-t hover:bg-muted/50"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{stat.state}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-lg font-bold ${
                                stat.nps >= 50
                                  ? 'text-green-600'
                                  : stat.nps >= 0
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {stat.nps}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="secondary">
                              {stat.totalCities}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="secondary">
                              {stat.totalStores}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {stat.totalResponses}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {stat.avgScore.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant={
                                stat.detractorRate > 30
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {stat.detractorRate.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedState(stat.state)}
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
            title="State-wise NPS Records"
            columns={[
              'state',
              'city',
              'storeCode',
              'storeName',
              'responseDate',
              'npsScore',
              'npsCategory',
              'comments',
            ]}
            pageSize={50}
          />
        </main>
      </div>

      {/* State Detail View Dialog */}
      {selectedState && (
        <StateDetailView
          stateName={selectedState}
          open={!!selectedState}
          onClose={() => setSelectedState(null)}
          data={data}
        />
      )}
    </div>
  );
}
