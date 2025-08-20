import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DriverPanel() {
  return (
    <Card className="bg-card border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="text-left">
          <CardTitle>NPS Drivers Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Key factors influencing customer satisfaction
          </p>
        </div>
        <Button variant="outline" size="sm">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent>
        {/* Empty state - waiting for real data */}
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No driver data available. Upload NPS data with driver metrics to see
            analysis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
