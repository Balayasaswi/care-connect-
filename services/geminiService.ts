
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { THERAPIST_SYSTEM_PROMPT, MODEL_NAME } from "../constants";
import { Message, MentalHealthStatus } from "../types";

class GeminiService {
  private getClient() {
    // Exclusively use process.env.API_KEY as per instructions
    return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  }

  public async sendMessage(message: string, history: Message[]): Promise<string> {
    const ai = this.getClient();
    
    const geminiHistory = history
      .map(m => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as any,
        parts: [{ text: m.content }]
      }));

    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: geminiHistory,
      config: {
        systemInstruction: THERAPIST_SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    try {
      const response: GenerateContentResponse = await chat.sendMessage({ message });
      return response.text || "I'm listening. Please, continue.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("I'm having a bit of trouble connecting to my thoughts. Could you try saying that again?");
    }
  }

  public async generateHandoffSummary(messages: Message[]): Promise<string> {
    const ai = this.getClient();
    const userInputs = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(" ");

    if (!userInputs) return "";

    const prompt = `Generate a clean, minimal session summary based ONLY on the user's messages.
    
    STRICT RULES:
    1. Output ONLY plain English text.
    2. NO markdown, NO bullets, NO emojis.
    3. Length: 2–6 sentences only.
    4. Focus on: User emotional tone, intent, and positive/negative signals.

    User messages:
    ${userInputs}`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
      return response.text?.trim() || "";
    } catch (error) {
      console.error("Summary generation failed:", error);
      return "";
    }
  }

  public async analyzeMentalHealth(summaryText: string): Promise<{ mentalHealth: MentalHealthStatus, keywords: string[] }> {
    const ai = this.getClient();
    
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analyze the following summary and provide sentiment analysis matching this specific pipeline:
        
        1. Mental Health Class: Choose exactly one from [CRITICAL, BAD, NEUTRAL, GOOD, HAPPY]
           - HAPPY: High positive score (>0.75)
           - GOOD: Moderate positive (0.55-0.75)
           - NEUTRAL: Mid-range (0.35-0.55)
           - BAD: Negative leaning (0.15-0.35)
           - CRITICAL: High distress (<0.15)
        
        2. Keywords: Identify up to 4 key words that influenced this score.
        
        Return ONLY valid JSON with properties: "mentalHealth" and "keywords".

        Summary to analyze:
        ${summaryText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mentalHealth: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["mentalHealth", "keywords"]
          }
        }
      });

      const data = JSON.parse(response.text);
      return {
        mentalHealth: (data.mentalHealth.toUpperCase() as MentalHealthStatus) || "NEUTRAL",
        keywords: (data.keywords || []).slice(0, 4)
      };
    } catch (e) {
      console.error("Mental health analysis error:", e);
      return { mentalHealth: "NEUTRAL", keywords: [] };
    }
  }
}

export const geminiService = new GeminiService();
