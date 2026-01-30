
import { User } from "../types";

class AuthService {
  private USERS_KEY = 'serenity_users_db';
  private CURRENT_USER_KEY = 'serenity_current_user';
  private activeOTP: string | null = null;

  public getAuthenticatedUser(): User | null {
    const userJson = localStorage.getItem(this.CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  public register(email: string, password: string): User {
    const users = this.getAllUsers();
    if (users.find(u => u.email === email)) {
      throw new Error("User already exists.");
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

  public generateOTP(): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.activeOTP = otp;
    // In real app, send via email. For demo, we alert it.
    alert(`[Serenity OTP] Your verification code is: ${otp}`);
    return otp;
  }

  public verifyOTP(code: string): boolean {
    return this.activeOTP === code;
  }

  public updateCredentials(currentEmail: string, newEmail: string, newPassword?: string) {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.email === currentEmail);
    if (userIndex === -1) throw new Error("User not found");

    users[userIndex].email = newEmail;
    if (newPassword) users[userIndex].password = newPassword;

    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    
    // Update active session
    const { password: _, ...userWithoutPassword } = users[userIndex];
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
  }

  private getAllUsers(): User[] {
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : [];
  }
}

export const authService = new AuthService();
