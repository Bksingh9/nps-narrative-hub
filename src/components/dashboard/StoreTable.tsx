import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

// Mock store data
const storeData = [
  {
    id: "ST001",
    name: "Phoenix Mall Delhi",
    state: "Delhi",
    nps: 52,
    trend: "up",
    change: "+8",
    responses: 245,
    status: "excellent"
  },
  {
    id: "ST002", 
    name: "Forum Mall Bangalore",
    state: "Karnataka",
    nps: 48,
    trend: "up",
    change: "+3",
    responses: 198,
    status: "good"
  },
  {
    id: "ST003",
    name: "Express Avenue Chennai",
    state: "Tamil Nadu", 
    nps: 35,
    trend: "down",
    change: "-12",
    responses: 156,
    status: "needs_attention"
  },
  {
    id: "ST004",
    name: "Palladium Mumbai",
    state: "Maharashtra",
    nps: 44,
    trend: "up",
    change: "+5",
    responses: 203,
    status: "good"
  },
  {
    id: "ST005",
    name: "City Centre Kolkata",
    state: "West Bengal",
    nps: 28,
    trend: "down",
    change: "-18",
    responses: 142,
    status: "critical"
  }
];

interface StoreTableProps {
  userRole: "admin" | "user" | "store_manager";
}

export function StoreTable({ userRole }: StoreTableProps) {
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

  // Filter stores based on user role
  const filteredStores = userRole === "store_manager" 
    ? storeData.slice(0, 2) // Store managers see limited stores
    : storeData;

  return (
    <Card className="bg-gradient-chart border-muted">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            Store Performance
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {userRole === "store_manager" ? "Your stores" : "Top performing locations"}
          </p>
        </div>
        <Button variant="outline" size="sm">
          View All
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {filteredStores.map((store) => (
            <div 
              key={store.id}
              className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-medium">{store.name}</h4>
                  {getStatusBadge(store.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {store.state} • {store.responses} responses
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
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
            </div>
          ))}
        </div>

        {userRole === "admin" && (
          <div className="mt-6 pt-4 border-t border-muted">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Showing {filteredStores.length} of 236 stores
              </span>
              <Button variant="ghost" size="sm">
                View Regional Summary
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}