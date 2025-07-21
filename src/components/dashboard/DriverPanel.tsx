import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

// Mock driver data
const driverData = [
  {
    name: "Store Cleanliness",
    correlation: 0.78,
    avgScore: 4.2,
    trend: "up",
    impact: "high"
  },
  {
    name: "Staff Helpfulness", 
    correlation: 0.72,
    avgScore: 4.1,
    trend: "up",
    impact: "high"
  },
  {
    name: "Product Availability",
    correlation: 0.65,
    avgScore: 3.8,
    trend: "down",
    impact: "medium"
  },
  {
    name: "Checkout Speed",
    correlation: 0.58,
    avgScore: 3.9,
    trend: "up", 
    impact: "medium"
  },
  {
    name: "Store Layout",
    correlation: 0.45,
    avgScore: 4.0,
    trend: "neutral",
    impact: "low"
  }
];

export function DriverPanel() {
  return (
    <Card className="bg-gradient-chart border-muted">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>NPS Drivers Analysis</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Key factors impacting customer satisfaction
          </p>
        </div>
        <Button variant="outline" size="sm">
          View Details
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {driverData.map((driver, index) => (
          <div 
            key={driver.name}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-medium">{driver.name}</h4>
                <Badge 
                  variant={driver.impact === "high" ? "default" : driver.impact === "medium" ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {driver.impact} impact
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Correlation: {driver.correlation.toFixed(2)}</span>
                <span>Avg: {driver.avgScore}/5</span>
                <div className="flex items-center gap-1">
                  {driver.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-nps-promoter" />
                  ) : driver.trend === "down" ? (
                    <TrendingDown className="w-3 h-3 text-destructive" />
                  ) : null}
                  <span className="capitalize">{driver.trend}</span>
                </div>
              </div>
            </div>

            {/* Correlation Bar */}
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-nps-promoter rounded-full transition-all duration-500"
                style={{ width: `${driver.correlation * 100}%` }}
              />
            </div>
          </div>
        ))}

        {/* Key Insight */}
        <div className="mt-6 pt-4 border-t border-muted">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
              Priority Action
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Focus on <strong>Store Cleanliness</strong> and <strong>Staff Helpfulness</strong> 
            for maximum NPS impact. These show the strongest correlation at 0.78 and 0.72 respectively.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}