import { useState } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { SideNav } from "@/components/layout/SideNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, TrendingUp, TrendingDown, Users } from "lucide-react";

// Mock state data
const stateData = [
  {
    name: "Delhi",
    nps: 52,
    trend: "up",
    change: "+8",
    responses: 1240,
    stores: 28,
    status: "excellent"
  },
  {
    name: "Maharashtra",
    nps: 48,
    trend: "up", 
    change: "+3",
    responses: 2156,
    stores: 42,
    status: "good"
  },
  {
    name: "Karnataka",
    nps: 46,
    trend: "up",
    change: "+5",
    responses: 1890,
    stores: 35,
    status: "good"
  },
  {
    name: "Tamil Nadu",
    nps: 28,
    trend: "down",
    change: "-18",
    responses: 1456,
    stores: 31,
    status: "critical"
  },
  {
    name: "West Bengal",
    nps: 35,
    trend: "down",
    change: "-12",
    responses: 987,
    stores: 22,
    status: "needs_attention"
  },
  {
    name: "Gujarat",
    nps: 44,
    trend: "up",
    change: "+7",
    responses: 1234,
    stores: 26,
    status: "good"
  }
];

export default function States() {
  const [userRole] = useState<"admin" | "user" | "store_manager">("admin");

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "excellent":
        return <Badge className="bg-nps-promoter/10 text-nps-promoter border-nps-promoter/20">Excellent</Badge>;
      case "good":
        return <Badge variant="secondary">Good</Badge>;
      case "needs_attention":
        return <Badge className="bg-nps-passive/10 text-nps-passive border-nps-passive/20">Needs Attention</Badge>;
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
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
              <h1 className="text-3xl font-bold">State Analysis</h1>
              <p className="text-muted-foreground">
                Regional NPS performance across India
              </p>
            </div>
            <Button>
              <Globe className="w-4 h-4 mr-2" />
              View Map
            </Button>
          </div>

          {/* States Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stateData.map((state) => (
              <Card key={state.name} className="bg-gradient-chart border-muted hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{state.name}</CardTitle>
                    {getStatusBadge(state.status)}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* NPS Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">NPS Score</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {state.nps > 0 ? "+" : ""}{state.nps}
                        </span>
                        <div className="flex items-center gap-1">
                          {state.trend === "up" ? (
                            <TrendingUp className="w-4 h-4 text-nps-promoter" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          )}
                          <Badge 
                            variant={state.trend === "up" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {state.change}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Responses</span>
                        </div>
                        <div className="font-semibold">{state.responses.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Stores</span>
                        </div>
                        <div className="font-semibold">{state.stores}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Performance</span>
                        <span>{Math.max(0, Math.min(100, state.nps + 50))}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-destructive via-nps-passive to-nps-promoter"
                          style={{ width: `${Math.max(0, Math.min(100, state.nps + 50))}%` }}
                        />
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}