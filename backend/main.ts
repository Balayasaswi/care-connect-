
import { DatabaseManager } from "./database";
import { AIEngine } from "./ai_engine";
import { IPFSManager } from "./ipfs_manager";
import { MailEngine } from "./mail_engine";

/**
 * SERENITY PATH SECURE BACKEND
 * Centrally manages all sensitive business logic and key-dependent operations.
 */
class SerenityBackend {
  private db = new DatabaseManager();
  private ai = new AIEngine();
  private ipfs = new IPFSManager();
  private mail = new MailEngine();

  // --- Auth ---
  public async handleAuth(path: 'login' | 'register', body: any) {
    return path === 'register' ? this.db.register(body) : this.db.login(body);
  }

  // --- AI ---
  public async *streamChat(history: any[], message: string) {
    yield* this.ai.streamChat(history, message);
  }

  public async generateSummary(text: string) {
    return this.ai.generateSummary(text);
  }

  // --- IPFS ---
  public async pinToIPFS(data: any) {
    return this.ipfs.pinData(data);
  }

  public async getIPFSHistory(email: string) {
    return this.ipfs.getHistory(email);
  }

  // --- Email ---
  public async sendMail(email: string, otp: string) {
    return this.mail.sendOTP(email, otp);
  }
}

export const server = new SerenityBackend();
