import { useState } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { SideNav } from "@/components/layout/SideNav";
import { KpiStrip } from "@/components/dashboard/KpiStrip";
import { TrendPanel } from "@/components/dashboard/TrendPanel";
import { DriverPanel } from "@/components/dashboard/DriverPanel";
import { StoreTable } from "@/components/dashboard/StoreTable";
import { NarrativeCard } from "@/components/dashboard/NarrativeCard";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { AIInsightsPanel } from "@/components/dashboard/AIInsightsPanel";

interface DashboardProps {
  userRole?: "admin" | "user" | "store_manager";
}

export default function Dashboard({ userRole = "admin" }: DashboardProps) {
  const [sidenavCollapsed, setSidenavCollapsed] = useState(false);

  const handleLogout = () => {
    // Handle logout logic
    console.log("Logout clicked");
  };

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar userRole={userRole} onLogout={handleLogout} />
      
      <div className="flex">
        <SideNav userRole={userRole} collapsed={sidenavCollapsed} />
        
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">NPS Intelligence Dashboard</h1>
              <p className="text-muted-foreground">
                Real-time insights across all Reliance Trends locations
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <FilterBar />

          {/* KPI Strip */}
          <KpiStrip />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Trend Analysis */}
            <div className="xl:col-span-2 space-y-6">
              <TrendPanel />
              {userRole !== "store_manager" && <DriverPanel />}
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              <NarrativeCard />
              
              {/* Store Performance Table */}
              <StoreTable userRole={userRole} />
            </div>

            {/* AI Insights & Escalations */}
            <div className="xl:col-span-1">
              <AIInsightsPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}