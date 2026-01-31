
import { server } from "../api";
import { Message, MentalHealthStatus } from "../types";
import { GoogleGenAI, Type } from "@google/genai";
import { MODEL_NAME } from "../constants";

class GeminiService {
  /**
   * Proxies the chat request to our secure backend.
   */
  public async *sendMessageStream(message: string, history: Message[]) {
    try {
      const stream = server.streamChat(history, message);
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      console.error("Backend Chat Error:", error);
      throw error;
    }
  }

  public async generateHandoffSummary(messages: Message[]): Promise<string> {
    // Summarization is fine on backend too, but for speed we use the server client directly if available
    // For consistency, we'll use a direct call here but assume the server handles the key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const userInputs = messages.filter(m => m.role === 'user').map(m => m.content).join(" ");
    if (!userInputs) return "";
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Summarize these thoughts in 2-4 sentences: ${userInputs}`,
    });
    return response.text || "";
  }

  public async analyzeMentalHealth(summaryText: string): Promise<{ mentalHealth: MentalHealthStatus, keywords: string[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze: "${summaryText}". Return JSON with mentalHealth (HAPPY, GOOD, NEUTRAL, BAD, CRITICAL) and keywords (array).`,
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
    const data = JSON.parse(response.text || "{}");
    return {
      mentalHealth: (data.mentalHealth?.toUpperCase() as MentalHealthStatus) || "NEUTRAL",
      keywords: data.keywords || []
    };
  }
}

export const geminiService = new GeminiService();
