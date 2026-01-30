
import { User } from "../types";
import { emailService } from "./emailService";

class AuthService {
  private USERS_KEY = 'serenity_users_db';
  private CURRENT_USER_KEY = 'serenity_current_user';
  private activeOTP: { code: string; email: string; expires: number } | null = null;

  public getAuthenticatedUser(): User | null {
    const userJson = localStorage.getItem(this.CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  public register(email: string, password: string): User {
    const users = this.getAllUsers();
    if (users.find(u => u.email === email)) {
      throw new Error("User already exists with this email.");
    }
    const newUser: User = { email, password, id: Date.now().toString() };
    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    return newUser;
  }

  public login(email: string, password: string): User {
    const users = this.getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error("Invalid email or password.");
    }
    const { password: _, ...userWithoutPassword } = user;
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    return userWithoutPassword;
  }

  public logout() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  /**
   * Generates and sends an OTP to the provided email.
   */
  public async requestOTP(email: string): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.activeOTP = {
      code: otp,
      email: email,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    };
    
    await emailService.sendOTP(email, otp);
  }

  public verifyOTP(code: string, email: string): boolean {
    if (!this.activeOTP) return false;
    if (this.activeOTP.email !== email) return false;
    if (Date.now() > this.activeOTP.expires) {
      this.activeOTP = null;
      return false;
    }
    const isValid = this.activeOTP.code === code;
    if (isValid) this.activeOTP = null; // Consume OTP
    return isValid;
  }

  public updateCredentials(currentEmail: string, newEmail: string, newPassword?: string) {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.email === currentEmail);
    if (userIndex === -1) throw new Error("User not found");

    users[userIndex].email = newEmail;
    if (newPassword) users[userIndex].password = newPassword;

    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    
    // Update current session if the email changed
    const { password: _, ...userWithoutPassword } = users[userIndex];
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
  }

  private getAllUsers(): User[] {
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : [];
  }
}

export const authService = new AuthService();
