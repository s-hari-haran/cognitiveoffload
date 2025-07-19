import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface WorkItemAnalysis {
  classification: string;
  summary: string;
  action_items: string[];
  sentiment: string;
  urgency_score: number;
  effort_estimate: string;
  deadline: string;
  context_tags: string[];
  stakeholders: string[];
  business_impact: string;
  follow_up_needed: boolean;
}

export async function analyzeWorkItem(content: string, sourceType: 'gmail' | 'slack'): Promise<WorkItemAnalysis> {
  try {
    const systemPrompt = `
You are the AI brain of "Cognitive Offload WorkOS" - an intelligent workplace dashboard 
that helps knowledge workers manage information overload across multiple platforms.

CORE MISSION:
Transform scattered communications into organized, prioritized, contextual insights that 
enable focused work and prevent important items from slipping through cracks.

PROCESSING INTELLIGENCE:

1. SMART CLASSIFICATION:
   🔥 Urgent: Explicit deadlines, client escalations, manager requests, system alerts
   💡 FYI: Project updates, meeting notes, informational content, reports  
   🗑 Ignore: Marketing emails, automated notifications, spam

2. INTELLIGENT SUMMARIZATION (15-20 Words Max):
   Focus on: WHO needs WHAT by WHEN
   - Extract key stakeholders
   - Identify specific deliverables
   - Highlight time sensitivity

3. ACTION EXTRACTION:
   Convert vague requests into concrete next steps with specific outcomes

4. CONTEXT MAPPING:
   Identify connections to projects, clients, team members, tools, deadlines

5. BUSINESS IMPACT SCORING:
   Urgency Scale (1-5) with effort estimation and deadline awareness

OUTPUT FORMAT (Strict JSON):
{
  "classification": "🔥 Urgent" | "💡 FYI" | "🗑 Ignore",
  "summary": "15-20 word max summary focusing on action/impact",
  "action_items": ["Specific actionable steps"],
  "sentiment": "Positive" | "Neutral" | "Negative",
  "urgency_score": 1-5,
  "effort_estimate": "Quick (2-5min)" | "Medium (15-30min)" | "Long (1hr+)",
  "deadline": "Today" | "This Week" | "Next Week" | "No Deadline",
  "context_tags": ["project-names", "client-names", "tools"],
  "stakeholders": ["email@domain.com"],
  "business_impact": "High" | "Medium" | "Low",
  "follow_up_needed": true | false
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            classification: { type: "string" },
            summary: { type: "string" },
            action_items: { type: "array", items: { type: "string" } },
            sentiment: { type: "string" },
            urgency_score: { type: "number" },
            effort_estimate: { type: "string" },
            deadline: { type: "string" },
            context_tags: { type: "array", items: { type: "string" } },
            stakeholders: { type: "array", items: { type: "string" } },
            business_impact: { type: "string" },
            follow_up_needed: { type: "boolean" }
          },
          required: ["classification", "summary", "action_items", "sentiment", "urgency_score", "effort_estimate", "deadline", "context_tags", "stakeholders", "business_impact", "follow_up_needed"],
        },
      },
      contents: `Source: ${sourceType.toUpperCase()}\n\nAnalyze this content:\n${content}`,
    });

    const rawJson = response.text;
    console.log(`Raw JSON from Gemini: ${rawJson}`);

    if (rawJson) {
      const data: WorkItemAnalysis = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini model");
    }
  } catch (error) {
    console.error(`Failed to analyze work item with Gemini:`, error);
    
    // Return intelligent fallback based on source type and content analysis
    const isUrgent = content.toLowerCase().includes('urgent') || 
                    content.toLowerCase().includes('asap') || 
                    content.toLowerCase().includes('deadline') ||
                    content.toLowerCase().includes('critical');
    
    const isSpam = content.toLowerCase().includes('unsubscribe') ||
                  content.toLowerCase().includes('marketing') ||
                  content.toLowerCase().includes('newsletter');

    return {
      classification: isSpam ? "🗑 Ignore" : isUrgent ? "🔥 Urgent" : "💡 FYI",
      summary: `${sourceType} communication requiring review and classification`,
      action_items: ["Review content", "Determine appropriate action"],
      sentiment: "Neutral",
      urgency_score: isUrgent ? 4 : isSpam ? 1 : 2,
      effort_estimate: isUrgent ? "Quick (2-5min)" : "Medium (15-30min)",
      deadline: isUrgent ? "Today" : "This Week",
      context_tags: [sourceType, "unprocessed"],
      stakeholders: [],
      business_impact: isUrgent ? "High" : isSpam ? "Low" : "Medium",
      follow_up_needed: !isSpam
    };
  }
}

export async function summarizeArticle(text: string): Promise<string> {
  const prompt = `Please summarize the following text concisely in 15-20 words while maintaining key points:\n\n${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Content summary not available";
  } catch (error) {
    console.error('Failed to summarize with Gemini:', error);
    return "Summary unavailable - content requires manual review";
  }
}

export interface Sentiment {
  rating: number;
  confidence: number;
}

export async function analyzeSentiment(text: string): Promise<Sentiment> {
  try {
    const systemPrompt = `You are a sentiment analysis expert. 
Analyze the sentiment of the text and provide a rating
from 1 to 5 stars and a confidence score between 0 and 1.
Respond with JSON in this format: 
{'rating': number, 'confidence': number}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            rating: { type: "number" },
            confidence: { type: "number" },
          },
          required: ["rating", "confidence"],
        },
      },
      contents: text,
    });

    const rawJson = response.text;

    if (rawJson) {
      const data: Sentiment = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    console.error(`Failed to analyze sentiment: ${error}`);
    return { rating: 3, confidence: 0.5 }; // Neutral fallback
  }
}