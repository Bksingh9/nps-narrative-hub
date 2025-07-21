import { useState } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { SideNav } from "@/components/layout/SideNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, TrendingDown, Building } from "lucide-react";

// Mock regional data
const regionData = [
  {
    name: "North India",
    states: ["Delhi", "Punjab", "Haryana", "Rajasthan"],
    nps: 48,
    trend: "up",
    change: "+7",
    stores: 45,
    responses: 2340,
    topCity: "Delhi"
  },
  {
    name: "West India", 
    states: ["Maharashtra", "Gujarat", "Goa"],
    nps: 46,
    trend: "up",
    change: "+4",
    stores: 52,
    responses: 2890,
    topCity: "Mumbai"
  },
  {
    name: "South India",
    states: ["Karnataka", "Tamil Nadu", "Andhra Pradesh", "Kerala"],
    nps: 31,
    trend: "down",
    change: "-15",
    stores: 68,
    responses: 3420,
    topCity: "Bangalore"
  },
  {
    name: "East India",
    states: ["West Bengal", "Odisha", "Jharkhand"],
    nps: 35,
    trend: "down",
    change: "-8",
    stores: 28,
    responses: 1560,
    topCity: "Kolkata"
  },
  {
    name: "Central India",
    states: ["Madhya Pradesh", "Chhattisgarh"],
    nps: 42,
    trend: "up",
    change: "+6",
    stores: 22,
    responses: 980,
    topCity: "Indore"
  },
  {
    name: "Northeast India",
    states: ["Assam", "Meghalaya", "Manipur"],
    nps: 39,
    trend: "neutral",
    change: "+1",
    stores: 12,
    responses: 450,
    topCity: "Guwahati"
  }
];

export default function Regions() {
  const [userRole] = useState<"admin" | "user" | "store_manager">("admin");

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const getStatusBadge = (nps: number) => {
    if (nps >= 50) return <Badge className="bg-nps-promoter/10 text-nps-promoter border-nps-promoter/20">Excellent</Badge>;
    if (nps >= 40) return <Badge variant="secondary">Good</Badge>;
    if (nps >= 30) return <Badge className="bg-nps-passive/10 text-nps-passive border-nps-passive/20">Needs Attention</Badge>;
    return <Badge variant="destructive">Critical</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar userRole={userRole} onLogout={handleLogout} />
      
      <div className="flex">
        <SideNav userRole={userRole} />
        
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Regional Insights</h1>
              <p className="text-muted-foreground">
                NPS performance analysis by geographic regions
              </p>
            </div>
            <Button>
              <MapPin className="w-4 h-4 mr-2" />
              Regional Heatmap
            </Button>
          </div>

          {/* Regions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {regionData.map((region) => (
              <Card key={region.name} className="bg-gradient-chart border-muted hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{region.name}</CardTitle>
                    {getStatusBadge(region.nps)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Top performer: {region.topCity}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* States List */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Coverage States</p>
                      <div className="flex flex-wrap gap-1">
                        {region.states.map((state) => (
                          <Badge key={state} variant="outline" className="text-xs">
                            {state}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* NPS Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Regional NPS</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {region.nps > 0 ? "+" : ""}{region.nps}
                        </span>
                        <div className="flex items-center gap-1">
                          {region.trend === "up" ? (
                            <TrendingUp className="w-4 h-4 text-nps-promoter" />
                          ) : region.trend === "down" ? (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          ) : null}
                          <Badge 
                            variant={region.trend === "up" ? "default" : region.trend === "down" ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {region.change}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Stores</span>
                        </div>
                        <div className="font-semibold">{region.stores}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Responses</span>
                        </div>
                        <div className="font-semibold">{region.responses.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Performance</span>
                        <span>{Math.max(0, Math.min(100, region.nps + 50))}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-destructive via-nps-passive to-nps-promoter"
                          style={{ width: `${Math.max(0, Math.min(100, region.nps + 50))}%` }}
                        />
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full">
                      Regional Deep Dive
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