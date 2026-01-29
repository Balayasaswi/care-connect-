import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { THERAPIST_SYSTEM_PROMPT, MODEL_NAME } from "../constants";
import { Message, MentalHealthStatus } from "../types";

class GeminiService {
  private getClient() {
    const apiKey = process.env.API_KEY || '';
    return new GoogleGenAI({ apiKey });
  }

  public async *sendMessageStream(message: string, history: Message[]) {
    try {
      const ai = this.getClient();
      
      const geminiHistory = history.map(m => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as any,
        parts: [{ text: m.content }]
      }));

      const responseStream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: [
          ...geminiHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: THERAPIST_SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          yield text;
        }
      }
    } catch (error: any) {
      console.error("Gemini Streaming Error:", error);
      throw error;
    }
  }

  public async generateHandoffSummary(messages: Message[]): Promise<string> {
    try {
      const ai = this.getClient();
      const userInputs = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join(" ");

      if (!userInputs) return "";

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Summarize these user thoughts in 2-4 sentences, focusing on emotional tone. Avoid markdown. Thoughts: ${userInputs}`,
      });
      return response.text?.trim() || "";
    } catch (error) {
      return "";
    }
  }

  public async analyzeMentalHealth(summaryText: string): Promise<{ mentalHealth: MentalHealthStatus, keywords: string[] }> {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analyze this summary: "${summaryText}". Return JSON with "mentalHealth" (HAPPY, GOOD, NEUTRAL, BAD, or CRITICAL) and "keywords" (array of 2-4 strings).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mentalHealth: { 
                type: Type.STRING,
                description: "One of: HAPPY, GOOD, NEUTRAL, BAD, CRITICAL"
              },
              keywords: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              }
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
      return { mentalHealth: "NEUTRAL", keywords: [] };
    }
  }
}

export const geminiService = new GeminiService();