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

  private async analyzeWithSupabase(
    request: AIAnalysisRequest
  ): Promise<AIAnalysisResponse> {
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
            dateRange: request.filters?.dateRange
              ? {
                  from: request.filters.dateRange.from?.toISOString(),
                  to: request.filters.dateRange.to?.toISOString(),
                }
              : undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling Supabase AI function:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async analyzeWithDirectAPI(
    request: AIAnalysisRequest
  ): Promise<AIAnalysisResponse> {
    // Prefer key from ctor, else fallback to localStorage
    const key = this.apiKey || localStorage.getItem('openai_api_key');
    if (!key) {
      return { success: false, error: 'No API key provided' };
    }

    try {
      let systemPrompt = '';
      let userPrompt = '';

      // Get system prompts from configuration
      const config = localStorage.getItem('system_config');
      const systemPrompts = config ? JSON.parse(config).systemPrompts : {};

      switch (request.analysisType) {
        case 'insights':
          systemPrompt =
            systemPrompts.insights ||
            'You are an expert retail analyst specializing in NPS data. Provide actionable insights based on the provided data.';
          userPrompt = `Analyze this NPS data and provide key insights:\n${JSON.stringify(request.data).slice(0, 6000)}\n\nFilters applied: ${JSON.stringify(request.filters)}\n\nProvide 3-5 bullet points with specific recommendations.`;
          break;
        case 'escalation':
          systemPrompt =
            systemPrompts.escalation ||
            'You are a retail operations expert. Identify critical issues that require immediate escalation based on NPS data patterns.';
          userPrompt = `Review this data for critical issues requiring escalation:\n${JSON.stringify(request.data).slice(0, 6000)}\n\nFilters: ${JSON.stringify(request.filters)}\n\nIdentify issues with severity levels and recommended actions.`;
          break;
        case 'trends':
          systemPrompt =
            systemPrompts.trends ||
            'You are a data scientist specializing in trend analysis. Identify patterns and predict future trends in NPS data.';
          userPrompt = `Analyze trends in this data:\n${JSON.stringify(request.data).slice(0, 6000)}\n\nFilters: ${JSON.stringify(request.filters)}\n\nProvide trend analysis and forecasting insights.`;
          break;
      }

      // Get model configuration
      const systemConfig = localStorage.getItem('system_config');
      const model = systemConfig
        ? JSON.parse(systemConfig).model
        : 'gpt-3.5-turbo';
      const fallbackModel = systemConfig
        ? JSON.parse(systemConfig).fallbackModel
        : 'gpt-3.5-turbo';

      let response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: model, // Use configured model (GPT-4 Turbo)
          temperature: 0.3,
          max_tokens: 2000,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      // If GPT-4 fails, try fallback model
      if (!response.ok && response.status === 429) {
        console.log('GPT-4 rate limited, trying fallback model...');
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: fallbackModel,
            temperature: 0.3,
            max_tokens: 1500,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        });
      }

      if (!response.ok) {
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const aiResponse = await response.json();
      const analysis = aiResponse?.choices?.[0]?.message?.content ?? '';

      return {
        success: true,
        analysis,
        analysisType: request.analysisType,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error calling OpenAI API directly:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Helper method to generate escalation metrics
  async generateEscalationMetrics(data: any[], filters?: any) {
    const result = await this.analyzeData({
      data,
      analysisType: 'escalation',
      filters,
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
      if (
        line.includes('CRITICAL') ||
        line.includes('HIGH') ||
        line.includes('URGENT')
      ) {
        escalations.push({
          id: `escalation-${i}`,
          title: line.substring(0, 50) + '...',
          severity: line.includes('CRITICAL') ? 'critical' : 'high',
          description: line,
          aiRecommendation:
            lines[i + 1] || 'No specific recommendation provided',
          timestamp: 'Generated from AI analysis',
        });
      }
    }

    return escalations;
  }
}
