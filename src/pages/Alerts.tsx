import { useState } from "react";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { SideNav } from "@/components/layout/SideNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";

// Mock alert data
const alertData = [
  {
    id: 1,
    title: "Critical NPS Drop - Chennai Express Avenue",
    description: "NPS dropped by -25 points in the last month",
    severity: "critical",
    type: "nps_drop",
    location: "Chennai, Tamil Nadu",
    timestamp: "2025-01-20T14:30:00Z",
    status: "active",
    value: -25
  },
  {
    id: 2,
    title: "Significant Decline - Kolkata South City",
    description: "NPS decreased by -18 points, needs immediate attention",
    severity: "high",
    type: "nps_drop",
    location: "Kolkata, West Bengal", 
    timestamp: "2025-01-20T11:15:00Z",
    status: "active",
    value: -18
  },
  {
    id: 3,
    title: "Exceptional Performance - Delhi CP",
    description: "NPS improved by +12 points, outstanding achievement",
    severity: "positive",
    type: "nps_gain",
    location: "Delhi, Delhi",
    timestamp: "2025-01-20T09:45:00Z",
    status: "acknowledged",
    value: +12
  },
  {
    id: 4,
    title: "Driver Correlation Alert - Store Cleanliness",
    description: "Cleanliness scores dropping across multiple locations",
    severity: "medium",
    type: "driver_alert",
    location: "Multiple Locations",
    timestamp: "2025-01-19T16:20:00Z",
    status: "investigating",
    value: null
  },
  {
    id: 5,
    title: "Response Volume Low - Northeast Region",
    description: "Survey responses below threshold for reliable NPS calculation",
    severity: "medium",
    type: "response_volume",
    location: "Northeast India",
    timestamp: "2025-01-19T13:10:00Z",
    status: "resolved",
    value: null
  }
];

export default function Alerts() {
  const [userRole] = useState<"admin" | "user" | "store_manager">("admin");
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive" className="bg-destructive/20">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "positive":
        return <Badge className="bg-nps-promoter/10 text-nps-promoter border-nps-promoter/20">Positive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "investigating":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "acknowledged":
        return <CheckCircle className="w-4 h-4 text-nps-promoter" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const filteredAlerts = alertData.filter(alert => {
    if (filter === "all") return true;
    if (filter === "active") return alert.status === "active" || alert.status === "investigating";
    if (filter === "resolved") return alert.status === "resolved" || alert.status === "acknowledged";
    return true;
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar userRole={userRole} onLogout={handleLogout} />
      
      <div className="flex">
        <SideNav userRole={userRole} />
        
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Alert Center</h1>
              <p className="text-muted-foreground">
                Monitor critical NPS changes and system notifications
              </p>
            </div>
            <Button>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Configure Alerts
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button 
              variant={filter === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("all")}
            >
              All Alerts ({alertData.length})
            </Button>
            <Button 
              variant={filter === "active" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("active")}
            >
              Active ({alertData.filter(a => a.status === "active" || a.status === "investigating").length})
            </Button>
            <Button 
              variant={filter === "resolved" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("resolved")}
            >
              Resolved ({alertData.filter(a => a.status === "resolved" || a.status === "acknowledged").length})
            </Button>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id} className="bg-gradient-chart border-muted hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(alert.status)}
                      <div>
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{alert.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      {alert.value && (
                        <div className="flex items-center gap-1">
                          {alert.value > 0 ? (
                            <TrendingUp className="w-4 h-4 text-nps-promoter" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          )}
                          <span className={`font-bold ${alert.value > 0 ? 'text-nps-promoter' : 'text-destructive'}`}>
                            {alert.value > 0 ? '+' : ''}{alert.value}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {formatTime(alert.timestamp)}
                    </div>
                    <div className="flex gap-2">
                      {alert.status === "active" && (
                        <>
                          <Button variant="outline" size="sm">
                            Investigate
                          </Button>
                          <Button variant="default" size="sm">
                            Acknowledge
                          </Button>
                        </>
                      )}
                      {alert.status === "investigating" && (
                        <Button variant="default" size="sm">
                          Mark Resolved
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
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