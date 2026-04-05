
import { SniffResult, Deal } from "../types";

// DeepSeek is OpenAI-compatible
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

export const sniffDeals = async (query: string): Promise<SniffResult> => {
  // Try multiple possible environment variable names for the API key
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  console.log("[Cyberhound] Starting sniff for:", query);
  console.log("[Cyberhound] API Key present:", !!apiKey);

  if (!apiKey?.trim()) {
    console.error("[Cyberhound] API Key is missing! Check your environment variables.");
    throw new Error(
      "API Key is missing. Please add your DeepSeek API key to your environment variables as DEEPSEEK_API_KEY.",
    );
  }

  try {
    console.log("[Cyberhound] Sending request to DeepSeek API...");
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content: "You are Cyberhound, an AI that sniffs out the best internet deals, free trials, and discounts. Search for active offers and provide a summary. You MUST provide structured deal data at the end of your response."
          },
          {
            role: "user",
            content: `Search for the best internet deals, free trials, and discounts for: ${query}. 
            Focus on active offers and provide a summary of your findings.
            
            CRITICAL: For each specific deal you find, you MUST also provide its details in this EXACT structured format at the end of your response:
            
            ---DEAL_START---
            TITLE: [Deal Title]
            DESCRIPTION: [Short description of the deal]
            CATEGORY: [Must be exactly one of: Free Trial, Discount, Coupon, Limited Time]
            LINK: [Direct URL if found, otherwise a relevant search link]
            SOURCE: [Website name]
            SCORE: [Relevance score 0-100]
            ---DEAL_END---`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Cyberhound] API Error Response:", errorData);
      throw new Error(errorData.error?.message || `DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || "I couldn't sniff out anything specific right now. Bark!";
    console.log("[Cyberhound] API Response received successfully.");
    
    // DeepSeek doesn't have the same grounding metadata as Gemini
    const sources: any[] = [];

    // Robust extraction using regular expressions
    const deals: Deal[] = [];
    const dealBlockRegex = /---DEAL_START---([\s\S]*?)---DEAL_END---/g;
    let match;

    while ((match = dealBlockRegex.exec(text)) !== null) {
      const block = match[1];
      
      const extractField = (fieldName: string) => {
        const fieldRegex = new RegExp(`${fieldName}:\\s*(.*)`, 'i');
        const fieldMatch = block.match(fieldRegex);
        return fieldMatch ? fieldMatch[1].trim() : '';
      };

      const title = extractField('TITLE');
      const description = extractField('DESCRIPTION');
      const categoryRaw = extractField('CATEGORY');
      const link = extractField('LINK');
      const source = extractField('SOURCE');
      const scoreStr = extractField('SCORE');

      // Validate category
      const validCategories = ['Free Trial', 'Discount', 'Coupon', 'Limited Time'];
      const category = validCategories.includes(categoryRaw) 
        ? (categoryRaw as Deal['category']) 
        : 'Discount';

      if (title && description) {
        deals.push({
          id: Math.random().toString(36).substring(2, 11),
          title,
          description,
          category,
          link: link || "#",
          source: source || "Web",
          relevanceScore: parseInt(scoreStr) || 70
        });
      }
    }
    
    console.log(`[Cyberhound] Extracted ${deals.length} deals.`);
    
    return {
      text,
      deals,
      sources
    };
  } catch (error) {
    console.error("[Cyberhound] Sniffing error:", error);
    throw error;
  }
};
