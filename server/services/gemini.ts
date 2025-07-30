// Standard Gemini API Implementation
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client with proper error handling
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

// Input validation and sanitization
function sanitizeContent(content: string, sourceType: 'gmail' | 'slack'): string {
  if (!content || typeof content !== 'string') {
    throw new Error('Invalid content: must be a non-empty string');
  }

  // Limit content length to prevent API issues
  const maxLength = 8000; // Safe limit for Gemini
  if (content.length > maxLength) {
    content = content.substring(0, maxLength) + '... [truncated]';
  }

  // Remove HTML tags and decode entities
  content = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Remove excessive whitespace
  content = content.replace(/\s+/g, ' ').trim();

  return content;
}

// Robust JSON parsing with validation
function parseAIResponse(text: string): WorkItemAnalysis {
  try {
    // Try multiple JSON extraction strategies
    let jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      // Try to find JSON after "```json" markers
      jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonMatch = [jsonMatch[1]];
      }
    }

    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<WorkItemAnalysis>;

    // Validate and normalize all fields
    return {
      classification: validateClassification(parsed.classification),
      summary: validateSummary(parsed.summary),
      action_items: validateArray(parsed.action_items, 'action_items'),
      sentiment: validateSentiment(parsed.sentiment),
      urgency_score: validateUrgencyScore(parsed.urgency_score),
      effort_estimate: validateEffortEstimate(parsed.effort_estimate),
      deadline: validateDeadline(parsed.deadline),
      context_tags: validateArray(parsed.context_tags, 'context_tags'),
      stakeholders: validateArray(parsed.stakeholders, 'stakeholders'),
      business_impact: validateBusinessImpact(parsed.business_impact),
      follow_up_needed: Boolean(parsed.follow_up_needed)
    };
  } catch (error) {
    console.error('❌ Failed to parse AI response:', error);
    console.error('Raw response:', text);
    throw new Error(`AI response parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Validation functions
function validateClassification(classification: any): string {
  const valid = ['urgent', 'fyi', 'ignore'];
  return valid.includes(classification) ? classification : 'fyi';
}

function validateSummary(summary: any): string {
  if (!summary || typeof summary !== 'string') return 'No summary available';
  return summary.length > 100 ? summary.substring(0, 100) + '...' : summary;
}

function validateArray(arr: any, fieldName: string): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter(item => typeof item === 'string' && item.trim().length > 0);
}

function validateSentiment(sentiment: any): string {
  const valid = ['positive', 'neutral', 'negative'];
  return valid.includes(sentiment) ? sentiment : 'neutral';
}

function validateUrgencyScore(score: any): number {
  const num = Number(score);
  return isNaN(num) ? 1 : Math.min(Math.max(num, 1), 5);
}

function validateEffortEstimate(estimate: any): string {
  const valid = ['Quick (2-5min)', 'Medium (15-30min)', 'Long (1hr+)'];
  return valid.includes(estimate) ? estimate : 'Quick (2-5min)';
}

function validateDeadline(deadline: any): string {
  const valid = ['Today', 'This Week', 'Next Week', 'No Deadline'];
  return valid.includes(deadline) ? deadline : 'No Deadline';
}

function validateBusinessImpact(impact: any): string {
  const valid = ['High', 'Medium', 'Low'];
  return valid.includes(impact) ? impact : 'Low';
}

export async function analyzeWorkItem(content: string, sourceType: 'gmail' | 'slack'): Promise<WorkItemAnalysis> {
  try {
    // Validate and sanitize input
    const sanitizedContent = sanitizeContent(content, sourceType);

    if (sanitizedContent.length === 0) {
      throw new Error('Content is empty after sanitization');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are an AI assistant that analyzes work communications and categorizes them for a productivity dashboard.

Analyze the following ${sourceType} content and provide a structured response in JSON format:

Content: ${sanitizedContent}

Please classify this into one of three categories:
- "urgent" - Requires immediate attention (deadlines, urgent requests, critical issues)
- "fyi" - Informational but not urgent (updates, announcements, general info)
- "ignore" - Not work-related or low priority (marketing, spam, personal)

Provide your analysis in this exact JSON format:
{
  "classification": "urgent|fyi|ignore",
  "summary": "15-word max summary focusing on action/impact",
  "action_items": ["Specific actionable steps"],
  "sentiment": "positive|neutral|negative",
  "urgency_score": 1-5,
  "effort_estimate": "Quick (2-5min)|Medium (15-30min)|Long (1hr+)",
  "deadline": "Today|This Week|Next Week|No Deadline",
  "context_tags": ["relevant-tags"],
  "stakeholders": ["email@domain.com"],
  "business_impact": "High|Medium|Low",
  "follow_up_needed": true|false
}

Focus on business relevance and actionable insights.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Raw JSON from Gemini:', text);

    // Parse and validate the response
    return parseAIResponse(text);
  } catch (error) {
    console.error('❌ AI analysis failed:', error);

    // Return a safe default analysis if AI fails
    return {
      classification: 'fyi',
      summary: 'Content analysis failed - manual review needed',
      action_items: ['Review this item manually'],
      sentiment: 'neutral',
      urgency_score: 1,
      effort_estimate: 'Quick (2-5min)',
      deadline: 'No Deadline',
      context_tags: ['manual-review'],
      stakeholders: [],
      business_impact: 'Low',
      follow_up_needed: true
    };
  }
}

export async function summarizeArticle(text: string): Promise<string> {
  try {
    const sanitizedText = sanitizeContent(text, 'gmail');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Summarize the following text in 2-3 sentences, focusing on the key points:

${sanitizedText}

Summary:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Article summarization failed:', error);
    return 'Summary unavailable';
  }
}

export interface Sentiment {
  rating: number;
  confidence: number;
}

export async function analyzeSentiment(inputText: string): Promise<Sentiment> {
  try {
    const sanitizedText = sanitizeContent(inputText, 'gmail');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze the sentiment of the following text and provide a rating from 1-10 (1=very negative, 10=very positive) and confidence level:

Text: ${sanitizedText}

Respond in JSON format:
{
  "rating": 1-10,
  "confidence": 0.0-1.0
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in sentiment response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<Sentiment>;

    return {
      rating: Math.min(Math.max(Number(parsed.rating) || 5, 1), 10),
      confidence: Math.min(Math.max(Number(parsed.confidence) || 0.5, 0), 1)
    };
  } catch (error) {
    console.error('❌ Sentiment analysis failed:', error);
    return { rating: 5, confidence: 0.5 };
  }
}