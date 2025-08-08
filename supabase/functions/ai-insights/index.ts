import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIRequest {
  data: any[];
  analysisType: 'insights' | 'escalation' | 'trends';
  filters?: {
    dateRange?: { from: string; to: string };
    store?: string;
    state?: string;
    region?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the API key from Supabase secrets
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Prefer OpenAI if configured; else fallback to Anthropic
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!openaiKey && !anthropicApiKey) {
      throw new Error('No AI provider API key found in secrets (OPENAI_API_KEY or ANTHROPIC_API_KEY)');
    }

    const { data, analysisType, filters }: AIRequest = await req.json()

    // Build the prompt based on analysis type
    let systemPrompt = ""
    let userPrompt = ""

    switch (analysisType) {
      case 'insights':
        systemPrompt = "You are an expert retail analyst specializing in NPS data. Provide actionable insights based on the provided data."
        userPrompt = `Analyze this NPS data and provide key insights:\n${JSON.stringify(data, null, 2)}\n\nFilters applied: ${JSON.stringify(filters, null, 2)}\n\nProvide 3-5 bullet points with specific recommendations.`
        break
      
      case 'escalation':
        systemPrompt = "You are a retail operations expert. Identify critical issues that require immediate escalation based on NPS data patterns."
        userPrompt = `Review this data for critical issues requiring escalation:\n${JSON.stringify(data, null, 2)}\n\nFilters: ${JSON.stringify(filters, null, 2)}\n\nIdentify issues with severity levels and recommended actions.`
        break
        
      case 'trends':
        systemPrompt = "You are a data scientist specializing in trend analysis. Identify patterns and predict future trends in NPS data."
        userPrompt = `Analyze trends in this data:\n${JSON.stringify(data, null, 2)}\n\nFilters: ${JSON.stringify(filters, null, 2)}\n\nProvide trend analysis and forecasting insights.`
        break
    }

    // Call AI provider
    let analysis = ''
    if (openaiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }
      const aiResponse = await response.json()
      analysis = aiResponse?.choices?.[0]?.message?.content ?? ''
    } else if (anthropicApiKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          temperature: 0.3,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`)
      }
      const aiResponse = await response.json()
      analysis = aiResponse.content[0].text
    }

    // Store the analysis in Supabase for caching/history
    const { error: insertError } = await supabaseClient
      .from('ai_analyses')
      .insert({
        analysis_type: analysisType,
        filters,
        analysis_result: analysis,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error storing analysis:', insertError)
      // Don't fail the request if storage fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        analysisType,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in AI insights function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})