import { useState } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { SideNav } from "@/components/layout/SideNav";
import { DriverPanel } from "@/components/dashboard/DriverPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Target, Lightbulb } from "lucide-react";



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

          {/* Empty state for detailed driver analysis */}
          <div className="grid grid-cols-1">
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No detailed driver data available. Upload NPS data with driver metrics to see category analysis.
              </p>
            </Card>
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