import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, MessageSquare } from "lucide-react";
import { useState } from "react";

export function NarrativeCard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrative, setNarrative] = useState({
    title: "AI-Generated Insights",
    content: "Your current NPS of +42 shows strong performance, up +5.2 points from last month. Store cleanliness and staff helpfulness are your top drivers with correlations of 0.78 and 0.72. Focus attention on Tamil Nadu region where several stores show declining trends.",
    timestamp: "Generated 2 minutes ago",
    confidence: "94%"
  });

  const handleRegenerate = async () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setNarrative({
        ...narrative,
        content: "Monthly analysis reveals sustained growth trajectory with NPS climbing +7 points over 6 months. Delhi and Karnataka markets lead performance gains. Prioritize product availability improvements in underperforming regions for maximum impact.",
        timestamp: "Generated just now",
        confidence: "97%"
      });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <Card className="bg-gradient-chart border-muted">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Insights
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            GPT-powered analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">
            {narrative.confidence} confidence
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Main Narrative */}
          <div className="p-4 rounded-lg bg-background/50 border border-muted">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm leading-relaxed">
                  {narrative.content}
                </p>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recommended Actions:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-nps-promoter" />
                <span>Maintain current cleanliness standards</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-nps-passive" />
                <span>Investigate Tamil Nadu performance decline</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-3" />
                <span>Expand successful Delhi model to other regions</span>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="pt-3 border-t border-muted flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {narrative.timestamp}
            </span>
            <Button variant="ghost" size="sm" className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" />
              Explain More
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}