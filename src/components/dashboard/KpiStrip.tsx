import { TrendingUp, TrendingDown, Users, Building } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KpiData {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
  color: string;
}

const kpiData: KpiData[] = [
  {
    label: "Overall NPS",
    value: "+42",
    change: "+5.2",
    trend: "up",
    icon: TrendingUp,
    color: "nps-promoter",
  },
  {
    label: "Total Responses",
    value: "12,847",
    change: "+12%",
    trend: "up", 
    icon: Users,
    color: "chart-1",
  },
  {
    label: "Active Stores",
    value: "236",
    change: "-2",
    trend: "down",
    icon: Building,
    color: "chart-2",
  },
  {
    label: "Rolling 3M Avg",
    value: "+38.7",
    change: "+2.1",
    trend: "up",
    icon: TrendingUp,
    color: "chart-3",
  },
];

export function KpiStrip() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpiData.map((kpi) => (
        <Card 
          key={kpi.label} 
          className="bg-gradient-chart hover:shadow-lg transition-all duration-300 animate-fade-in border-muted"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  {kpi.label}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <Badge 
                    variant={kpi.trend === "up" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {kpi.trend === "up" ? "+" : ""}{kpi.change}
                  </Badge>
                </div>
              </div>
              <div className={`p-3 rounded-lg bg-${kpi.color}/10 border border-${kpi.color}/20`}>
                <kpi.icon className={`w-6 h-6 text-${kpi.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              {kpi.trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-nps-promoter" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}