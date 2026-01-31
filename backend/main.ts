
import express from 'express';
import cors from 'cors';
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
  private app = express();

  constructor() {
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes() {
    // Auth routes
    this.app.post('/auth/login', this.handleAuthLogin.bind(this));
    this.app.post('/auth/register', this.handleAuthRegister.bind(this));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'Backend is running' });
    });
  }

  private async handleAuthLogin(req: any, res: any) {
    try {
      const result = await this.db.login(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  private async handleAuthRegister(req: any, res: any) {
    try {
      const result = await this.db.register(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

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

  public start(port: number = 5000) {
    this.app.listen(port, () => {
      console.log(`🚀 Backend running on http://localhost:${port}`);
    });
  }
}

const server = new SerenityBackend();
const PORT = process.env.PORT || 5000;
server.start(Number(PORT));
