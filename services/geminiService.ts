
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { THERAPIST_SYSTEM_PROMPT, MODEL_NAME } from "../constants";
import { Message } from "../types";

class GeminiService {
  private getClient() {
    // Fix: Initialize GoogleGenAI with a named parameter using process.env.API_KEY directly as per guidelines
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      // Fix: Access response.text as a property, not a method
      const response: GenerateContentResponse = await chat.sendMessage({ message });
      return response.text || "I'm listening. Please, continue.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("I'm having a little trouble connecting right now.");
    }
  }

  public async summarizeSession(messages: Message[]): Promise<string> {
    const ai = this.getClient();
    const userInputs = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join("\n---\n");

    if (!userInputs) return "";

    const prompt = `Based ONLY on the user's messages, provide a structured summary in plain text.
    Do NOT summarize the assistant's responses.
    
    Format the response as follows:
    MAIN TOPICS DISCUSSED:
    [List topics]
    
    USER GOALS OR CONCERNS:
    [List goals/concerns]
    
    KEY INSIGHTS OR OUTCOMES:
    [List insights]

    User messages to process:
    ${userInputs}`;

    try {
      // Fix: Use ai.models.generateContent with model and contents together
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
      return response.text || "";
    } catch (error) {
      console.error("Auto-summarization Error:", error);
      return "";
    }
  }
}

export const geminiService = new GeminiService();
