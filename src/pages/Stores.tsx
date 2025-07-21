import { useState } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { SideNav } from "@/components/layout/SideNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, TrendingUp, TrendingDown, Users, MapPin } from "lucide-react";

// Mock store data
const storeData = [
  {
    id: "DL001",
    name: "Connaught Place",
    city: "Delhi",
    state: "Delhi",
    nps: 58,
    trend: "up",
    change: "+12",
    responses: 156,
    manager: "Rajesh Kumar",
    status: "excellent"
  },
  {
    id: "MH002", 
    name: "Phoenix Mills",
    city: "Mumbai",
    state: "Maharashtra",
    nps: 51,
    trend: "up",
    change: "+6",
    responses: 189,
    manager: "Priya Sharma",
    status: "good"
  },
  {
    id: "KA003",
    name: "Forum Mall",
    city: "Bangalore", 
    state: "Karnataka",
    nps: 49,
    trend: "up",
    change: "+8",
    responses: 167,
    manager: "Arjun Singh",
    status: "good"
  },
  {
    id: "TN004",
    name: "Express Avenue",
    city: "Chennai",
    state: "Tamil Nadu", 
    nps: 22,
    trend: "down",
    change: "-25",
    responses: 134,
    manager: "Lakshmi Reddy",
    status: "critical"
  },
  {
    id: "WB005",
    name: "South City Mall",
    city: "Kolkata",
    state: "West Bengal",
    nps: 31,
    trend: "down", 
    change: "-18",
    responses: 98,
    manager: "Amit Das",
    status: "needs_attention"
  },
  {
    id: "GJ006",
    name: "Ahmedabad One",
    city: "Ahmedabad",
    state: "Gujarat",
    nps: 47,
    trend: "up",
    change: "+9",
    responses: 142,
    manager: "Kavita Patel",
    status: "good"
  }
];

export default function Stores() {
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
              <h1 className="text-3xl font-bold">Store Performance</h1>
              <p className="text-muted-foreground">
                Individual store NPS analysis across all locations
              </p>
            </div>
            <Button>
              <Building className="w-4 h-4 mr-2" />
              Store Analytics
            </Button>
          </div>

          {/* Stores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {storeData.map((store) => (
              <Card key={store.id} className="bg-gradient-chart border-muted hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{store.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{store.city}, {store.state}</span>
                      </div>
                    </div>
                    {getStatusBadge(store.status)}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Store ID & Manager */}
                    <div className="text-xs text-muted-foreground">
                      <div>Store ID: {store.id}</div>
                      <div>Manager: {store.manager}</div>
                    </div>

                    {/* NPS Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">NPS Score</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {store.nps > 0 ? "+" : ""}{store.nps}
                        </span>
                        <div className="flex items-center gap-1">
                          {store.trend === "up" ? (
                            <TrendingUp className="w-4 h-4 text-nps-promoter" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          )}
                          <Badge 
                            variant={store.trend === "up" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {store.change}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Responses */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Responses</span>
                      </div>
                      <div className="font-semibold">{store.responses}</div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Performance</span>
                        <span>{Math.max(0, Math.min(100, store.nps + 50))}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-destructive via-nps-passive to-nps-promoter"
                          style={{ width: `${Math.max(0, Math.min(100, store.nps + 50))}%` }}
                        />
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full">
                      View Store Details
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