interface AIAnalysisRequest {
  data: any[];
  analysisType: 'insights' | 'escalation' | 'trends';
  filters?: {
    dateRange?: { from: Date | undefined; to: Date | undefined };
    store?: string;
    state?: string;
    region?: string;
  };
}

interface AIAnalysisResponse {
  success: boolean;
  analysis?: string;
  analysisType?: string;
  timestamp?: string;
  error?: string;
}

export class AIService {
  private apiKey: string | null = null;
  private useSupabase: boolean = true;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
    // Check if we should use Supabase edge function or direct API
    this.useSupabase = !apiKey;
  }

  async analyzeData(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (this.useSupabase) {
      return this.analyzeWithSupabase(request);
    } else {
      return this.analyzeWithDirectAPI(request);
    }
  }

  private async analyzeWithSupabase(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      const response = await fetch('/functions/v1/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: request.data,
          analysisType: request.analysisType,
          filters: {
            ...request.filters,
            dateRange: request.filters?.dateRange ? {
              from: request.filters.dateRange.from?.toISOString(),
              to: request.filters.dateRange.to?.toISOString()
            } : undefined
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling Supabase AI function:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async analyzeWithDirectAPI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'No API key provided'
      };
    }

    try {
      let systemPrompt = "";
      let userPrompt = "";

      switch (request.analysisType) {
        case 'insights':
          systemPrompt = "You are an expert retail analyst specializing in NPS data. Provide actionable insights based on the provided data.";
          userPrompt = `Analyze this NPS data and provide key insights:\n${JSON.stringify(request.data, null, 2)}\n\nFilters applied: ${JSON.stringify(request.filters, null, 2)}\n\nProvide 3-5 bullet points with specific recommendations.`;
          break;
        
        case 'escalation':
          systemPrompt = "You are a retail operations expert. Identify critical issues that require immediate escalation based on NPS data patterns.";
          userPrompt = `Review this data for critical issues requiring escalation:\n${JSON.stringify(request.data, null, 2)}\n\nFilters: ${JSON.stringify(request.filters, null, 2)}\n\nIdentify issues with severity levels and recommended actions.`;
          break;
          
        case 'trends':
          systemPrompt = "You are a data scientist specializing in trend analysis. Identify patterns and predict future trends in NPS data.";
          userPrompt = `Analyze trends in this data:\n${JSON.stringify(request.data, null, 2)}\n\nFilters: ${JSON.stringify(request.filters, null, 2)}\n\nProvide trend analysis and forecasting insights.`;
          break;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          temperature: 0.3,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const aiResponse = await response.json();
      const analysis = aiResponse.content[0].text;

      return {
        success: true,
        analysis,
        analysisType: request.analysisType,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error calling Anthropic API directly:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Helper method to generate escalation metrics
  async generateEscalationMetrics(data: any[], filters?: any) {
    const result = await this.analyzeData({
      data,
      analysisType: 'escalation',
      filters
    });

    if (!result.success || !result.analysis) {
      return [];
    }

    // Parse the AI response to extract structured escalation data
    // This would need more sophisticated parsing in a real implementation
    return this.parseEscalationResponse(result.analysis);
  }

  private parseEscalationResponse(analysis: string) {
    // Simple parsing - in production, you'd want more sophisticated parsing
    // or ask the AI to return structured JSON
    const lines = analysis.split('\n').filter(line => line.trim());
    const escalations = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('CRITICAL') || line.includes('HIGH') || line.includes('URGENT')) {
        escalations.push({
          id: `escalation-${i}`,
          title: line.substring(0, 50) + '...',
          severity: line.includes('CRITICAL') ? 'critical' : 'high',
          description: line,
          aiRecommendation: lines[i + 1] || 'No specific recommendation provided',
          timestamp: 'Generated from AI analysis'
        });
      }
    }

    return escalations;
  }
}