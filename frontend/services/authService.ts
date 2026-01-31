
import { User } from "../types";
import { emailService } from "./emailService";
import { server } from "../api";

class AuthService {
  private CURRENT_USER_KEY = 'serenity_current_user';
  private activeOTP: { code: string; email: string; expires: number } | null = null;

  public getAuthenticatedUser(): User | null {
    const userJson = localStorage.getItem(this.CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  public async register(email: string, password: string): Promise<User> {
    const user = await server.handleAuth('register', { email, password });
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }

  public async login(email: string, password: string): Promise<User> {
    const user = await server.handleAuth('login', { email, password });
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }

  public logout() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  public async requestOTP(email: string): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.activeOTP = {
      code: otp,
      email: email,
      expires: Date.now() + 10 * 60 * 1000
    };
    await emailService.sendOTP(email, otp);
  }

  public verifyOTP(code: string, email: string): boolean {
    if (!this.activeOTP || this.activeOTP.email !== email) return false;
    if (Date.now() > this.activeOTP.expires) return false;
    const isValid = this.activeOTP.code === code;
    if (isValid) this.activeOTP = null;
    return isValid;
  }

  public async updateCredentials(currentEmail: string, newEmail: string, newPassword?: string) {
    // Simple update logic - in real backend this would be a PATCH /api/users
    console.log("Updating credentials via backend proxy...");
  }
}

export const authService = new AuthService();
