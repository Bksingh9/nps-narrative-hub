interface InsightRequest {
  type: 'general' | 'store' | 'state' | 'city' | 'alert' | 'trend';
  data: any;
  context?: string;
}

interface InsightResponse {
  success: boolean;
  insights: string[];
  recommendations?: string[];
  alerts?: string[];
  error?: string;
}

class OpenAIService {
  private apiKey: string | null = null;
  private apiUrl = 'https://api.openai.com/v1/chat/completions';
  private model = 'gpt-3.5-turbo';

  constructor() {
    this.initializeApiKey();
  }

  private initializeApiKey() {
    // Try to get API key from localStorage or environment
    this.apiKey =
      localStorage.getItem('openai_api_key') ||
      process.env.REACT_APP_OPENAI_API_KEY ||
      null;
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('openai_api_key', key);
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  async generateInsights(request: InsightRequest): Promise<InsightResponse> {
    // If no API key, use intelligent fallback
    if (!this.apiKey) {
      return this.generateLocalInsights(request);
    }

    try {
      const prompt = this.buildPrompt(request);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are an NPS analytics expert. Provide actionable insights based on the data. Be specific and reference actual numbers.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      return this.parseAIResponse(content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      // Fallback to local insights
      return this.generateLocalInsights(request);
    }
  }

  private buildPrompt(request: InsightRequest): string {
    const { type, data, context } = request;

    switch (type) {
      case 'general':
        return `Analyze this NPS data and provide 3 key insights:
          Total Responses: ${data.totalResponses}
          NPS Score: ${data.npsScore}
          Promoters: ${data.promoters} (${data.promoterPercent}%)
          Detractors: ${data.detractors} (${data.detractorPercent}%)
          States: ${data.states}
          Stores: ${data.stores}
          ${context || ''}`;

      case 'store':
        return `Analyze this store's NPS performance:
          Store: ${data.storeName} (${data.storeCode})
          NPS Score: ${data.npsScore}
          Responses: ${data.responses}
          Trend: ${data.trend}
          Compare to average: ${data.vsAverage}
          ${context || ''}`;

      case 'state':
        return `Analyze this state's NPS performance:
          State: ${data.state}
          NPS Score: ${data.npsScore}
          Stores: ${data.storeCount}
          Responses: ${data.responses}
          Top Store: ${data.topStore}
          Bottom Store: ${data.bottomStore}
          ${context || ''}`;

      case 'city':
        return `Analyze this city's NPS performance:
          City: ${data.city}
          State: ${data.state}
          NPS Score: ${data.npsScore}
          Stores: ${data.storeCount}
          Population: ${data.population || 'Unknown'}
          ${context || ''}`;

      case 'alert':
        return `Generate alerts for this NPS data:
          Low Performing Stores: ${JSON.stringify(data.lowPerformers)}
          Declining Trends: ${JSON.stringify(data.declining)}
          Critical Feedback: ${data.criticalCount}
          ${context || ''}`;

      case 'trend':
        return `Analyze NPS trends:
          Current Period: ${data.currentNPS}
          Previous Period: ${data.previousNPS}
          Change: ${data.change}%
          Velocity: ${data.velocity}
          ${context || ''}`;

      default:
        return `Analyze this data: ${JSON.stringify(data)}`;
    }
  }

  private parseAIResponse(content: string): InsightResponse {
    // Parse AI response into structured format
    const lines = content.split('\n').filter(line => line.trim());
    const insights: string[] = [];
    const recommendations: string[] = [];
    const alerts: string[] = [];

    let currentSection = 'insights';

    for (const line of lines) {
      if (line.toLowerCase().includes('recommend')) {
        currentSection = 'recommendations';
      } else if (
        line.toLowerCase().includes('alert') ||
        line.toLowerCase().includes('concern')
      ) {
        currentSection = 'alerts';
      }

      const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
      if (cleanLine) {
        if (currentSection === 'recommendations') {
          recommendations.push(cleanLine);
        } else if (currentSection === 'alerts') {
          alerts.push(cleanLine);
        } else {
          insights.push(cleanLine);
        }
      }
    }

    return {
      success: true,
      insights,
      recommendations,
      alerts,
    };
  }

  private generateLocalInsights(request: InsightRequest): InsightResponse {
    const { type, data } = request;
    const insights: string[] = [];
    const recommendations: string[] = [];
    const alerts: string[] = [];

    switch (type) {
      case 'general':
        const npsScore = data.npsScore || 0;
        const promoterPercent = data.promoterPercent || 0;
        const detractorPercent = data.detractorPercent || 0;

        // Generate insights based on actual data
        if (npsScore > 50) {
          insights.push(
            `Strong NPS score of ${npsScore} indicates excellent customer satisfaction across ${data.stores || 0} stores.`
          );
        } else if (npsScore > 0) {
          insights.push(
            `NPS score of ${npsScore} shows room for improvement. Focus on converting passives to promoters.`
          );
        } else {
          insights.push(
            `Critical NPS score of ${npsScore} requires immediate attention. ${detractorPercent}% are detractors.`
          );
        }

        insights.push(
          `${promoterPercent}% of customers are promoters, actively recommending your brand.`
        );
        insights.push(
          `Geographic coverage spans ${data.states || 0} states with ${data.totalResponses || 0} total responses.`
        );

        // Recommendations
        if (detractorPercent > 20) {
          recommendations.push(
            `High detractor rate (${detractorPercent}%). Implement immediate recovery program for dissatisfied customers.`
          );
        }
        if (promoterPercent < 50) {
          recommendations.push(
            `Increase promoter percentage from ${promoterPercent}% to 50%+ through enhanced customer experience initiatives.`
          );
        }
        recommendations.push(
          `Focus on top-performing practices from high-NPS stores and replicate across all locations.`
        );

        // Alerts
        if (npsScore < 0) {
          alerts.push(
            `⚠️ Critical: NPS below zero indicates more detractors than promoters.`
          );
        }
        if (data.decliningStores > 5) {
          alerts.push(
            `📉 ${data.decliningStores} stores showing declining NPS trends.`
          );
        }
        break;

      case 'store':
        const storeNPS = data.npsScore || 0;
        const vsAverage = data.vsAverage || 0;

        insights.push(
          `${data.storeName} (${data.storeCode}) has an NPS of ${storeNPS} based on ${data.responses} responses.`
        );

        if (vsAverage > 0) {
          insights.push(
            `Performing ${vsAverage} points above average - a top performer in the network.`
          );
        } else if (vsAverage < 0) {
          insights.push(
            `Performing ${Math.abs(vsAverage)} points below average - improvement needed.`
          );
        }

        if (data.trend === 'improving') {
          insights.push(
            `Positive trend detected with ${data.trendValue}% improvement over last period.`
          );
        } else if (data.trend === 'declining') {
          alerts.push(
            `⚠️ Declining trend: ${Math.abs(data.trendValue)}% decrease in NPS.`
          );
        }

        if (storeNPS < 0) {
          recommendations.push(
            `Urgent: Implement customer recovery program at this location.`
          );
          recommendations.push(
            `Conduct staff training on customer service excellence.`
          );
        }
        break;

      case 'state':
        insights.push(
          `${data.state} has ${data.storeCount} stores with average NPS of ${data.npsScore}.`
        );
        insights.push(
          `Top performer: ${data.topStore} | Needs attention: ${data.bottomStore}`
        );
        insights.push(
          `Total responses: ${data.responses} across all locations in the state.`
        );

        if (data.npsScore < 30) {
          alerts.push(
            `⚠️ State-wide NPS below 30 - systematic issues may exist.`
          );
          recommendations.push(
            `Conduct state-wide assessment and implement improvement program.`
          );
        }
        break;

      case 'city':
        insights.push(
          `${data.city}, ${data.state} shows NPS of ${data.npsScore} across ${data.storeCount} stores.`
        );

        if (data.npsScore > 50) {
          insights.push(
            `Strong performance indicates good market fit and customer satisfaction.`
          );
        } else {
          insights.push(
            `Below-average performance suggests local market challenges.`
          );
          recommendations.push(
            `Research local competition and customer preferences in ${data.city}.`
          );
        }
        break;

      case 'alert':
        if (data.lowPerformers && data.lowPerformers.length > 0) {
          alerts.push(
            `🔴 ${data.lowPerformers.length} stores with critically low NPS scores need immediate attention.`
          );
        }
        if (data.declining && data.declining.length > 0) {
          alerts.push(
            `📉 ${data.declining.length} stores showing declining trends.`
          );
        }
        if (data.criticalCount > 0) {
          alerts.push(
            `⚠️ ${data.criticalCount} critical customer feedback items require response.`
          );
        }
        break;

      case 'trend':
        const change = data.change || 0;
        if (change > 0) {
          insights.push(
            `📈 Positive trend: NPS improved by ${change}% from ${data.previousNPS} to ${data.currentNPS}.`
          );
        } else if (change < 0) {
          alerts.push(
            `📉 Negative trend: NPS declined by ${Math.abs(change)}% from ${data.previousNPS} to ${data.currentNPS}.`
          );
        } else {
          insights.push(
            `Stable NPS at ${data.currentNPS} with no significant change.`
          );
        }

        if (data.velocity === 'accelerating') {
          insights.push(
            `Improvement is accelerating - current initiatives are working.`
          );
        } else if (data.velocity === 'decelerating') {
          alerts.push(
            `⚠️ Improvement rate is slowing - consider new strategies.`
          );
        }
        break;
    }

    return {
      success: true,
      insights: insights.length > 0 ? insights : ['Analyzing data patterns...'],
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      alerts: alerts.length > 0 ? alerts : undefined,
    };
  }

  async generateDrillDownInsights(
    level: 'state' | 'city' | 'store',
    identifier: string,
    data: any
  ): Promise<InsightResponse> {
    const request: InsightRequest = {
      type: level as any,
      data: {
        ...data,
        identifier,
        level,
      },
      context: `Drill-down analysis for ${level}: ${identifier}`,
    };

    return this.generateInsights(request);
  }

  async generateRealTimeAlerts(data: any): Promise<string[]> {
    const alerts: string[] = [];

    // Check for critical NPS scores
    if (data.npsScore < 0) {
      alerts.push(`🔴 CRITICAL: Overall NPS is negative (${data.npsScore})`);
    }

    // Check for low performing stores
    const lowPerformers = data.stores?.filter((s: any) => s.nps < 0) || [];
    if (lowPerformers.length > 0) {
      alerts.push(`⚠️ ${lowPerformers.length} stores have negative NPS scores`);
    }

    // Check for declining trends
    if (data.trend && data.trend < -5) {
      alerts.push(`📉 NPS declining by ${Math.abs(data.trend)}% this period`);
    }

    // Check response rate
    if (data.responseRate && data.responseRate < 10) {
      alerts.push(
        `📊 Low response rate (${data.responseRate}%) may affect data reliability`
      );
    }

    // Check for detractor spike
    if (data.detractorPercent > 40) {
      alerts.push(
        `🚨 High detractor rate: ${data.detractorPercent}% of customers are dissatisfied`
      );
    }

    return alerts;
  }
}

export default new OpenAIService();
