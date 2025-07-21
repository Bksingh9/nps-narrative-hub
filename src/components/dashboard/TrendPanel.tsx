import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, Filter } from "lucide-react";

// Mock data for demonstration
const trendData = [
  { month: "Jan", nps: 35, responses: 1240 },
  { month: "Feb", nps: 38, responses: 1180 },
  { month: "Mar", nps: 42, responses: 1320 },
  { month: "Apr", nps: 39, responses: 1290 },
  { month: "May", nps: 45, responses: 1380 },
  { month: "Jun", nps: 42, responses: 1350 },
];

export function TrendPanel() {
  return (
    <Card className="bg-gradient-chart border-muted">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            NPS Trend Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            6-month rolling performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            6M
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Chart Area - Using CSS grid for visualization */}
        <div className="h-64 mb-4 relative">
          <div className="absolute inset-0 grid grid-cols-6 gap-4 items-end">
            {trendData.map((data, index) => (
              <div key={data.month} className="flex flex-col items-center">
                <div
                  className="w-12 bg-gradient-to-t from-primary to-primary/60 rounded-t-md transition-all duration-500 hover:shadow-glow"
                  style={{ height: `${(data.nps / 50) * 100}%` }}
                />
                <div className="mt-2 text-center">
                  <div className="text-sm font-semibold">{data.nps}</div>
                  <div className="text-xs text-muted-foreground">{data.month}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-nps-promoter">+7</div>
            <div className="text-xs text-muted-foreground">6M Growth</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">42</div>
            <div className="text-xs text-muted-foreground">Current NPS</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-chart-2">38.7</div>
            <div className="text-xs text-muted-foreground">3M Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-chart-3">1,350</div>
            <div className="text-xs text-muted-foreground">Responses</div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-6 pt-4 border-t border-muted">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-nps-promoter/10 text-nps-promoter border-nps-promoter/20">
              Trending Up
            </Badge>
            <span className="text-sm text-muted-foreground">Key Insight</span>
          </div>
          <p className="text-sm">
            NPS has improved by <strong>+7 points</strong> over the last 6 months, 
            with the strongest growth in Q2. May showed the highest score of +45.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}