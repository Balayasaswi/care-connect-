
export class DatabaseManager {
  private STORAGE_KEY = 'server_db_users';

  private getUsers(): any[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  }

  private saveUsers(users: any[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
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
