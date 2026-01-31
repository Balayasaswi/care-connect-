
import { GoogleGenAI } from "@google/genai";

/**
 * SERENITY PATH SECURE BACKEND
 * This file handles all sensitive operations that require secret keys.
 * In a production environment, this would be a Node.js/Express server.
 */

class SerenityBackend {
  // Simulated server-side database
  private users: any[] = JSON.parse(localStorage.getItem('server_db_users') || '[]');

  private getGeminiClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  // --- AUTH ENDPOINTS ---
  public async handleAuth(path: string, body: any) {
    if (path === 'register') {
      if (this.users.find(u => u.email === body.email)) throw new Error("User exists");
      const newUser = { ...body, id: Date.now().toString() };
      this.users.push(newUser);
      localStorage.setItem('server_db_users', JSON.stringify(this.users));
      return { email: newUser.email, id: newUser.id };
    }
    if (path === 'login') {
      const user = this.users.find(u => u.email === body.email && u.password === body.password);
      if (!user) throw new Error("Invalid credentials");
      return { email: user.email, id: user.id };
    }
  }

  // --- GEMINI ENDPOINTS ---
  public async *streamChat(history: any[], message: string) {
    const ai = this.getGeminiClient();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { temperature: 0.7 },
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

  // --- IPFS ENDPOINTS (PINATA) ---
  public async pinToIPFS(data: any) {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': process.env.PINATA_API_KEY || '',
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY || ''
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: { name: `Journal_${Date.now()}`, keyvalues: { userEmail: data.userEmail } }
      })
    });
    if (!response.ok) throw new Error("Pinata pinning failed");
    return await response.json();
  }

  public async getIPFSHistory(email: string) {
    const url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]={"userEmail":{"value":"${email}","op":"eq"}}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY || '',
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY || ''
      }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.rows || [];
  }

  // --- EMAIL ENDPOINTS (EMAILJS) ---
  public async sendMail(email: string, otp: string) {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: { to_email: email, otp, app_name: 'Serenity Path' }
      })
    });
    return response.ok;
  }
}

export const server = new SerenityBackend();
