import fs from 'fs';
import path from 'path';

export class DatabaseManager {
  private STORAGE_PATH = path.join(process.cwd(), 'data', 'users.json');

  constructor() {
    const dir = path.dirname(this.STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private getUsers(): any[] {
    try {
      return JSON.parse(fs.readFileSync(this.STORAGE_PATH, 'utf-8'));
    } catch {
      return [];
    }
  }

  private saveUsers(users: any[]) {
    fs.writeFileSync(this.STORAGE_PATH, JSON.stringify(users, null, 2));
  }

  public register(body: any) {
    const users = this.getUsers();
    if (users.find(u => u.email === body.email)) {
      throw new Error("User with this email already exists in the sanctuary.");
    }
    const newUser = { ...body, id: Date.now().toString() };
    users.push(newUser);
    this.saveUsers(users);
    return { email: newUser.email, id: newUser.id };
  }

  public login(body: any) {
    const users = this.getUsers();
    const user = users.find(u => u.email === body.email && u.password === body.password);
    if (!user) {
      throw new Error("Invalid credentials. Please verify your email and password.");
    }
    return { email: user.email, id: user.id };
  }
}
