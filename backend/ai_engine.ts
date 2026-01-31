
import { GoogleGenAI } from "@google/genai";

export class AIEngine {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public async *streamChat(history: any[], message: string) {
    const ai = this.getClient();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { temperature: 0.75, topP: 0.95 },
      history: history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    });

    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) {
      yield chunk.text;
    }
  }

  public async generateSummary(userInputs: string) {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize the following personal reflections into a supportive 2-4 sentence summary: ${userInputs}`,
    });
    return response.text || "";
  }
}
