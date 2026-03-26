
import { GoogleGenAI, Type } from "@google/genai";
import { SniffResult, Deal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const sniffDeals = async (query: string): Promise<SniffResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for the best internet deals, free trials, and discounts for: ${query}. 
      Focus on active offers and provide a summary of your findings.
      
      CRITICAL: For each specific deal you find, you MUST also provide its details in this EXACT structured format at the end of your response:
      
      ---DEAL_START---
      TITLE: [Deal Title]
      DESCRIPTION: [Short description of the deal]
      CATEGORY: [Must be exactly one of: Free Trial, Discount, Coupon, Limited Time]
      LINK: [Direct URL if found, otherwise a relevant search link]
      SOURCE: [Website name]
      SCORE: [Relevance score 0-100]
      ---DEAL_END---`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "I couldn't sniff out anything specific right now. Bark!";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      uri: chunk.web?.uri || "#"
    })) || [];

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
    
    return {
      text,
      deals,
      sources
    };
  } catch (error) {
    console.error("Sniffing error:", error);
    throw error;
  }
};
