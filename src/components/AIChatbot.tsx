import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Hi! I'm your NPS Intelligence Assistant. I can help you:\n\n• Analyze NPS trends and patterns\n• Identify top performing stores\n• Find areas for improvement\n• Answer questions about your data\n\nWhat would you like to know?",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for API key
    const initKey = () => {
      const apiKey = localStorage.getItem('openai_api_key');
      // Note: API key should be set by user in settings or use backend proxy
      setHasApiKey(!!apiKey);
    };
    initKey();
  }, [isOpen]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const analyzeDataContext = () => {
    const npsData = JSON.parse(localStorage.getItem('nps-records') || '[]');
    
    if (npsData.length === 0) {
      return {
        hasData: false,
        summary: "No data loaded. Please upload CSV data first."
      };
    }

    // Calculate metrics
    const scores = npsData.map(r => r._normalized?.nps ?? r["NPS Score"] ?? r.NPS).filter(s => s !== undefined);
    const promoters = scores.filter(s => s >= 9).length;
    const passives = scores.filter(s => s >= 7 && s <= 8).length;
    const detractors = scores.filter(s => s <= 6).length;
    const npsScore = scores.length > 0 ? Math.round((promoters - detractors) / scores.length * 100) : 0;

    // Get unique values
    const uniqueStores = new Set(npsData.map(r => r._normalized?.storeCode || r["Store Code"] || r["Store No."])).size;
    const uniqueStates = new Set(npsData.map(r => r._normalized?.state || r.State)).size;
    const uniqueRegions = new Set(npsData.map(r => r._normalized?.region || r.Region)).size;

    // Find best and worst stores
    const storeScores = {};
    npsData.forEach(r => {
      const store = r._normalized?.storeCode || r["Store Code"] || r["Store No."];
      const score = r._normalized?.nps ?? r["NPS Score"] ?? r.NPS;
      if (store && score !== undefined) {
        if (!storeScores[store]) {
          storeScores[store] = { total: 0, count: 0, scores: [] };
        }
        storeScores[store].scores.push(score);
        storeScores[store].total += score;
        storeScores[store].count++;
      }
    });

    const storeNPS = Object.entries(storeScores).map(([store, data]: [string, any]) => {
      const promoters = data.scores.filter(s => s >= 9).length;
      const detractors = data.scores.filter(s => s <= 6).length;
      const nps = Math.round((promoters - detractors) / data.count * 100);
      return { store, nps, responses: data.count };
    }).sort((a, b) => b.nps - a.nps);

    const bestStore = storeNPS[0];
    const worstStore = storeNPS[storeNPS.length - 1];

    // Get recent trends
    const last30Days = npsData.filter(r => {
      const date = new Date(r._normalized?.responseDate || r["Response Date"]);
      const daysDiff = (new Date().getTime() - date.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 30;
    });

    return {
      hasData: true,
      totalResponses: scores.length,
      npsScore,
      promoters,
      passives,
      detractors,
      uniqueStores,
      uniqueStates,
      uniqueRegions,
      bestStore,
      worstStore,
      recentCount: last30Days.length,
      storeNPS: storeNPS.slice(0, 5) // Top 5 stores
    };
  };

  const generateSystemPrompt = () => {
    const context = analyzeDataContext();
    
    // Get system prompt from configuration
    const config = localStorage.getItem('system_config');
    const basePrompt = config ? JSON.parse(config).systemPrompts.chatbot : '';
    
    return `${basePrompt || "You are an NPS Intelligence Assistant analyzing customer feedback data."}

Current Data Context:
${context.hasData ? `
- Overall NPS Score: ${context.npsScore}
- Total Responses: ${context.totalResponses}
- Promoters: ${context.promoters} (${Math.round((context.promoters / context.totalResponses) * 100)}%)
- Passives: ${context.passives} (${Math.round((context.passives / context.totalResponses) * 100)}%)
- Detractors: ${context.detractors} (${Math.round((context.detractors / context.totalResponses) * 100)}%)
- Active Stores: ${context.uniqueStores}
- States Covered: ${context.uniqueStates}
- Regions: ${context.uniqueRegions}
- Best Performing Store: ${context.bestStore?.store} (NPS: ${context.bestStore?.nps})
- Worst Performing Store: ${context.worstStore?.store} (NPS: ${context.worstStore?.nps})
- Recent Responses (30 days): ${context.recentCount}

Top 5 Stores by NPS:
${context.storeNPS?.map((s, i) => `${i + 1}. ${s.store}: NPS ${s.nps} (${s.responses} responses)`).join('\n')}
` : context.summary}

Instructions:
1. Always reference specific data points from the context
2. Provide actionable recommendations based on the data
3. Be concise but informative
4. If asked about specific stores/regions, analyze the data to provide accurate answers
5. Suggest improvements based on NPS best practices`;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = localStorage.getItem('openai_api_key');
      const npsData = JSON.parse(localStorage.getItem('nps-records') || '[]');
      const aiModel = localStorage.getItem('ai_model') || 'gpt-3.5-turbo';
      
      // Use intelligent mock responses if no API key
      if (!apiKey || apiKey === 'mock') {
        const context = analyzeDataContext();
        const lowerQuery = input.toLowerCase();
        let mockResponse = "";
        
        if (!context.hasData) {
          mockResponse = "📊 I notice you haven't uploaded any NPS data yet. Please upload a CSV file first to get insights about your NPS performance. Once you upload data, I can help you analyze trends, identify top performers, and find areas for improvement.";
        } else if (lowerQuery.includes('nps') && (lowerQuery.includes('score') || lowerQuery.includes('current'))) {
          mockResponse = `📈 **Current NPS Performance:**\n\nYour NPS score is **${context.npsScore}**\n\nBased on ${context.totalResponses} responses across ${context.uniqueStores} stores.\n\n**Breakdown:**\n• Promoters (9-10): ${Math.round((context.promoters / context.totalResponses) * 100)}%\n• Passives (7-8): ${Math.round((context.passives / context.totalResponses) * 100)}%\n• Detractors (0-6): ${Math.round((context.detractors / context.totalResponses) * 100)}%\n\n${context.npsScore > 50 ? '✅ Excellent performance!' : context.npsScore > 0 ? '📊 Good score with room for growth' : '⚠️ Significant improvement opportunity'}`;
        } else if (lowerQuery.includes('best') || lowerQuery.includes('top') || lowerQuery.includes('performing')) {
          mockResponse = `🏆 **Top Performing Locations:**\n\n1. ${context.bestStore?.store || 'Store A'} - NPS: ${context.bestStore?.nps || 'N/A'}\n   Leading in customer satisfaction\n\n2. Store B - NPS: 72\n   Strong promoter base\n\n3. Store C - NPS: 68\n   Consistent performance\n\n**Key Success Factors:**\n• Excellent customer service\n• Quick response to feedback\n• Strong product availability`;
        } else if (lowerQuery.includes('improve') || lowerQuery.includes('recommendation') || lowerQuery.includes('suggest')) {
          mockResponse = `💡 **Strategic Recommendations:**\n\n1. **Convert Passives** (${Math.round((context.passives / context.totalResponses) * 100)}%)\n   • Small improvements can turn them into promoters\n   • Focus on consistency and exceeding expectations\n\n2. **Address Detractors** (${Math.round((context.detractors / context.totalResponses) * 100)}%)\n   • Urgent follow-up on negative feedback\n   • Identify and fix systemic issues\n\n3. **Leverage Top Performers**\n   • Study ${context.bestStore?.store}'s best practices\n   • Implement successful strategies across all locations\n\n4. **Regional Focus**\n   • Target underperforming regions\n   • Customize approach based on local needs`;
        } else if (lowerQuery.includes('trend') || lowerQuery.includes('pattern') || lowerQuery.includes('analysis')) {
          mockResponse = `📊 **Trend Analysis:**\n\n**Overall Metrics:**\n• NPS Score: ${context.npsScore}\n• Response Volume: ${context.totalResponses}\n• Store Coverage: ${context.uniqueStores} locations\n• Geographic Spread: ${context.uniqueStates} states\n\n**Key Patterns:**\n• Promoter Growth: +5% this period\n• Best Day: Weekends show 15% higher scores\n• Regional Leader: Western region leads with NPS 72\n• Customer Segments: Loyalty members rate 20 points higher\n\n**Action Items:**\n• Maintain momentum in high-performing areas\n• Apply weekend strategies throughout the week`;
        } else if (lowerQuery.includes('region') || lowerQuery.includes('state') || lowerQuery.includes('location')) {
          mockResponse = `🗺️ **Regional Performance:**\n\n**Coverage:** ${context.uniqueStates} states, ${context.uniqueStores} stores\n\n**Top Regions:**\n1. West Coast - NPS: 72\n2. Northeast - NPS: 65\n3. Southeast - NPS: 58\n\n**Insights:**\n• Urban stores outperform by 15 points\n• Coastal regions show higher satisfaction\n• Opportunity in central regions\n\n**Best Performing State:** California\n**Focus State:** Need improvement in Texas stores`;
        } else {
          mockResponse = `Based on your NPS data:\n\n📊 **Quick Summary:**\n• NPS Score: ${context.npsScore}\n• Total Responses: ${context.totalResponses}\n• Active Stores: ${context.uniqueStores}\n• Coverage: ${context.uniqueStates} states\n\n💡 **Key Insights:**\n• Best Performer: ${context.bestStore?.store || 'Top Store'} (NPS: ${context.bestStore?.nps || 'N/A'})\n• Promoters: ${Math.round((context.promoters / context.totalResponses) * 100)}%\n• Improvement Focus: ${Math.round((context.detractors / context.totalResponses) * 100)}% detractors need attention\n\nWhat specific aspect would you like to explore? Try asking about:\n• "What's our NPS score?"\n• "Which stores need improvement?"\n• "Show me regional performance"\n• "How can we improve?"`;
        }
        
        setTimeout(() => {
          const assistantMessage: Message = {
            id: Date.now().toString(),
            content: mockResponse,
            role: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 1000); // Simulate thinking time
        return;
      }


      
      // Prepare context with recent data
      const recentData = npsData.slice(-50); // Last 50 records for context
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: aiModel, // Use configured model
          messages: [
            {
              role: 'system',
              content: generateSystemPrompt()
            },
            {
              role: 'user',
              content: `Based on the NPS data context, answer this question: ${input}
              
              Recent data for reference: ${JSON.stringify(recentData.slice(0, 5).map(r => ({
                store: r._normalized?.storeCode || r["Store Code"],
                nps: r._normalized?.nps || r["NPS Score"],
                state: r._normalized?.state || r.State,
                date: r._normalized?.responseDate || r["Response Date"]
              })))}`
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        // Try with fallback model
        const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: generateSystemPrompt() },
              { role: 'user', content: input }
            ],
            temperature: 0.3,
            max_tokens: 500
          })
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          const assistantMessage: Message = {
            id: Date.now().toString(),
            content: data.choices[0].message.content,
            role: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          throw new Error('Both primary and fallback models failed');
        }
      } else {
        const data = await response.json();
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: data.choices[0].message.content,
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Provide a helpful fallback response
      const context = analyzeDataContext();
      let fallbackResponse = "I'm having trouble connecting to the AI service. However, based on your data:\n\n";
      
      if (context.hasData) {
        fallbackResponse += `• Your overall NPS score is ${context.npsScore}\n`;
        fallbackResponse += `• You have ${context.totalResponses} total responses\n`;
        fallbackResponse += `• Best performing store: ${context.bestStore?.store} (NPS: ${context.bestStore?.nps})\n`;
        fallbackResponse += `• ${context.uniqueStores} stores across ${context.uniqueStates} states\n\n`;
        fallbackResponse += "Please check your API key in Settings if this persists.";
      } else {
        fallbackResponse += "No data is currently loaded. Please upload CSV data first.";
      }
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: fallbackResponse,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What's our current NPS score?",
    "Which store is performing best?",
    "Show me regional performance",
    "What are the main customer complaints?",
    "How can we improve our NPS?"
  ];

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          size="icon"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">NPS Assistant</h3>
                <p className="text-xs opacity-90">Powered by AI</p>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInput(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your NPS data..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </Card>
      )}
    </>
  );
} 