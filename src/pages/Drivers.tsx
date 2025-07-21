import { useState } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { SideNav } from "@/components/layout/SideNav";
import { DriverPanel } from "@/components/dashboard/DriverPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Target, Lightbulb } from "lucide-react";

// Mock detailed driver insights
const driverInsights = [
  {
    category: "Service Quality",
    drivers: [
      { name: "Staff Helpfulness", score: 4.1, correlation: 0.72, impact: "high" },
      { name: "Product Knowledge", score: 3.9, correlation: 0.68, impact: "high" },
      { name: "Checkout Speed", score: 3.8, correlation: 0.58, impact: "medium" }
    ]
  },
  {
    category: "Store Environment", 
    drivers: [
      { name: "Store Cleanliness", score: 4.2, correlation: 0.78, impact: "high" },
      { name: "Store Layout", score: 4.0, correlation: 0.45, impact: "low" },
      { name: "Temperature Comfort", score: 3.7, correlation: 0.42, impact: "low" }
    ]
  },
  {
    category: "Product & Pricing",
    drivers: [
      { name: "Product Availability", score: 3.8, correlation: 0.65, impact: "medium" },
      { name: "Price Value", score: 3.5, correlation: 0.62, impact: "medium" },
      { name: "Product Quality", score: 4.1, correlation: 0.59, impact: "medium" }
    ]
  }
];

export default function Drivers() {
  const [userRole] = useState<"admin" | "user" | "store_manager">("admin");

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "high":
        return <Badge className="bg-nps-promoter/10 text-nps-promoter border-nps-promoter/20">High Impact</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium Impact</Badge>;
      case "low":
        return <Badge variant="outline">Low Impact</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar userRole={userRole} onLogout={handleLogout} />
      
      <div className="flex">
        <SideNav userRole={userRole} />
        
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Driver Analysis</h1>
              <p className="text-muted-foreground">
                Deep dive into factors that influence customer satisfaction
              </p>
            </div>
            <Button>
              <Target className="w-4 h-4 mr-2" />
              Generate Action Plan
            </Button>
          </div>

          {/* Main Driver Panel */}
          <DriverPanel />

          {/* Detailed Category Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {driverInsights.map((category) => (
              <Card key={category.category} className="bg-gradient-chart border-muted">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {category.drivers.map((driver) => (
                    <div key={driver.name} className="p-3 rounded-lg bg-background/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{driver.name}</h4>
                        {getImpactBadge(driver.impact)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Score: {driver.score}/5</span>
                          <span>r = {driver.correlation.toFixed(2)}</span>
                        </div>
                        
                        {/* Correlation Bar */}
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-nps-promoter rounded-full transition-all duration-500"
                            style={{ width: `${driver.correlation * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Key Recommendations */}
          <Card className="bg-gradient-chart border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Priority Recommendations
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-nps-promoter/5 border border-nps-promoter/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-nps-promoter" />
                    <h4 className="font-medium">Immediate Actions</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Implement store cleanliness audits (r=0.78)</li>
                    <li>• Staff helpfulness training program (r=0.72)</li>
                    <li>• Product knowledge workshops (r=0.68)</li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-chart-2/5 border border-chart-2/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-chart-2" />
                    <h4 className="font-medium">Areas to Monitor</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Product availability tracking (r=0.65)</li>
                    <li>• Value perception surveys (r=0.62)</li>
                    <li>• Checkout process optimization (r=0.58)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}