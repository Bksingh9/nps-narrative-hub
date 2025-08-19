/**
 * Application Initialization
 * Sets up API key and system configuration
 */

export function initializeApp() {
  // Initialize default API key if not already set
  const savedApiKey = localStorage.getItem('openai_api_key');
  if (!savedApiKey) {
    // Do not seed a demo API key. Prompt user to configure one in Settings instead.
    console.warn('No OpenAI API key found. Set it in Settings to enable AI features.');
  }

  // Initialize system configuration
  const savedConfig = localStorage.getItem('system_config');
  if (!savedConfig) {
    const defaultConfig = {
      systemPrompts: {
        insights: 'You are an expert retail analyst specializing in NPS data. Provide actionable insights based on the provided data. Focus on: 1) Key trends and patterns, 2) Areas of concern, 3) Opportunities for improvement, 4) Specific recommendations. Format your response as clear bullet points.',
        escalation: 'You are a retail operations expert. Identify critical issues that require immediate escalation based on NPS data patterns. Focus on: 1) Stores or regions with declining NPS, 2) High volume of detractors, 3) Recurring complaints, 4) Urgent issues requiring management attention.',
        trends: 'You are a data scientist specializing in trend analysis. Identify patterns and predict future trends in NPS data. Focus on: 1) Temporal patterns, 2) Seasonal variations, 3) Regional differences, 4) Predictive insights for the next period.',
        anomalies: 'You are an anomaly detection specialist. Identify unusual patterns or outliers in the NPS data that require investigation. Focus on: 1) Statistical outliers, 2) Sudden changes in patterns, 3) Unusual store performance, 4) Data quality issues.'
      },
      aiSettings: {
        autoGenerateInsights: false,
        insightsRefreshInterval: 3600000, // 1 hour in milliseconds
        maxRecordsForAnalysis: 100,
        temperature: 0.7,
        maxTokens: 500
      },
      dataSettings: {
        defaultDateRange: 30, // days
        minNpsScore: 0,
        maxNpsScore: 10,
        promoterThreshold: 9,
        detractorThreshold: 6
      }
    };
    localStorage.setItem('system_config', JSON.stringify(defaultConfig));
    console.log('Initialized system configuration');
  }

  // Initialize sample data notice
  const existingData = localStorage.getItem('nps-records');
  if (!existingData || JSON.parse(existingData).length === 0) {
    console.log('No NPS data found. Please upload CSV data to get started.');
  }

  console.log('App initialization complete');
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  // Check if we're in a browser environment
  if (!localStorage.getItem('app_initialized')) {
    initializeApp();
    localStorage.setItem('app_initialized', 'true');
  }
}

// Export helper to get system prompts
export function getSystemPrompt(type: 'insights' | 'escalation' | 'trends' | 'chatbot'): string {
  const config = localStorage.getItem('system_config');
  if (config) {
    const parsed = JSON.parse(config);
    return parsed.systemPrompts[type] || '';
  }
  return '';
}

// Export helper to get API key
export function getApiKey(): string {
  return localStorage.getItem('openai_api_key') || '';
}

// Export helper to get current model
export function getCurrentModel(): string {
  const config = localStorage.getItem('system_config');
  if (config) {
    const parsed = JSON.parse(config);
    return parsed.model || 'gpt-3.5-turbo';
  }
  return 'gpt-3.5-turbo';
} 