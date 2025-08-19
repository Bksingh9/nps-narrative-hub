import { useState, useEffect } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { SideNav } from "@/components/layout/SideNav";
import { KpiStrip } from "@/components/dashboard/KpiStrip";
import { TrendPanel } from "@/components/dashboard/TrendPanel";
import { StoreTable } from "@/components/dashboard/StoreTable";
import { DriverPanel } from "@/components/dashboard/DriverPanel";
import { AIInsightsPanel } from "@/components/dashboard/AIInsightsPanel";
import { GlobalFilterBar } from "@/components/GlobalFilterBar";
import CSVDataSync from "@/components/dashboard/CSVDataSync";
import DataExportButton from "@/components/DataExportButton";
import { RealTimeAlerts } from "@/components/RealTimeAlerts";
import { DrillDownView } from "@/components/DrillDownView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { safeGetRecords } from "@/lib/data";
import authService from "@/services/authService";
import { useData } from "@/contexts/DataContext";

export default function Dashboard() {
  const currentUser = authService.getCurrentUser();
  const [userRole] = useState<"admin" | "user" | "store_manager">(currentUser?.role || "user");
  const [isLoading, setIsLoading] = useState(false);
  
  // Use centralized data context
  const { 
    filteredData: dashboardData, 
    aggregates, 
    applyFilters, 
    refreshData,
    hasData 
  } = useData();

  // Refresh data on mount
  useEffect(() => {
    refreshData();
  }, []);

  const handleLogout = () => {
    console.log("Logout clicked");
  };



  return (
    <div className="min-h-screen bg-background">
      <HeaderBar userRole={userRole} onLogout={handleLogout} />
      
      {/* CSV Data Sync Component */}
      <CSVDataSync onDataLoaded={(data, metadata) => {
        console.log('Dashboard received data:', data.length, 'records');
      }} />
      
      <div className="flex">
        <SideNav userRole={userRole} />
        
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">NPS Intelligence Dashboard</h1>
              <p className="text-muted-foreground">
                Real-time insights across all Reliance Trends locations
              </p>
            </div>
            <div className="flex gap-2">
              <DataExportButton 
                data={dashboardData}
                filename="dashboard-nps-data"
                showFormats={userRole === 'admin'}
              />
              {userRole === 'admin' && (
                <Button
                  variant={!hasData ? "default" : "outline"}
                  onClick={() => window.location.href = '/upload'}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV
                </Button>
              )}
            </div>
          </div>
          
          {/* Global Filter Bar */}
          <GlobalFilterBar />
          
          {/* Tabs for Different Views */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="drilldown">Drill Down</TabsTrigger>
              <TabsTrigger value="alerts">Alerts & Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Strip */}
              <KpiStrip />

              {/* Compact Alerts under KPIs */}
              <RealTimeAlerts compact maxAlerts={3} />

              {/* Trend Panel - full width and taller */}
              <TrendPanel />

              {/* Top Performing Stores - full width below chart */}
              <StoreTable userRole={userRole} />

              {/* Secondary Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Driver Panel */}
                <DriverPanel />

                {/* AI Insights Panel */}
                <AIInsightsPanel />
              </div>
            </TabsContent>
            
            <TabsContent value="drilldown" className="space-y-6">
              <DrillDownView data={dashboardData} />
            </TabsContent>
            
            <TabsContent value="alerts" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RealTimeAlerts />
                <AIInsightsPanel />
              </div>
              <div className="mt-6">
                <RealTimeAlerts compact={false} maxAlerts={10} />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}