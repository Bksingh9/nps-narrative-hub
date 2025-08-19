import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { useData } from "@/contexts/DataContext";

export function TrendPanel() {
  // Use DataContext for data
  const { filteredData, isLoading } = useData();

  // Calculate daily NPS trends from filtered data
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0 || isLoading) {
      // Return default data for loading state
      return [
        { date: 'Mon', nps: 0, responses: 0 },
        { date: 'Tue', nps: 0, responses: 0 },
        { date: 'Wed', nps: 0, responses: 0 },
        { date: 'Thu', nps: 0, responses: 0 },
        { date: 'Fri', nps: 0, responses: 0 },
        { date: 'Sat', nps: 0, responses: 0 },
        { date: 'Sun', nps: 0, responses: 0 },
      ];
    }

    // Group data by date
    const dailyData = new Map<string, { scores: number[], date: Date }>();
    
    filteredData.forEach(record => {
      const dateStr = record.responseDate || record['Response Date'] || record.Date;
      if (!dateStr) return;
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!dailyData.has(dayKey)) {
        dailyData.set(dayKey, { scores: [], date });
      }
      
      const score = record.npsScore || 
                   record['NPS Score'] || 
                   record['On a scale of 0 to 10, with 0 being the lowest and 10 being the highest rating - how likely are you to recommend Trends to friends and family'];
      
      const numScore = typeof score === 'number' ? score : parseFloat(score || '0');
      if (!isNaN(numScore)) {
        dailyData.get(dayKey)?.scores.push(numScore);
      }
    });

    // Calculate NPS for each day
    const sortedDates = Array.from(dailyData.entries())
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
      .slice(-7) // Last 7 days
      .map(([dayKey, data]) => {
        const scores = data.scores;
        const promoters = scores.filter(s => s >= 9).length;
        const detractors = scores.filter(s => s <= 6).length;
        const nps = scores.length > 0 
          ? Math.round(((promoters - detractors) / scores.length) * 100)
          : 0;
        
        return {
          date: data.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          nps,
          responses: scores.length
        };
      });

    // If we have less than 7 days, fill with zeros
    while (sortedDates.length < 7) {
      sortedDates.unshift({
        date: 'N/A',
        nps: 0,
        responses: 0
      });
    }

    return sortedDates;
  }, [filteredData, isLoading]);

  return (
    <Card className="bg-gradient-chart hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">NPS Trend Analysis</CardTitle>
        <TrendingUp className="w-5 h-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[420px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading trend data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'currentColor', fontSize: 11 }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor', fontSize: 11 }}
                  domain={[-100, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="nps" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="responses" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}