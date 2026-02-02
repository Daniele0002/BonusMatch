import { UserProfile, MatchResult } from '../types';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string; // Stored securely (simulated)
  createdAt: string;
  profile?: UserProfile;
  results?: MatchResult[];
}

// Simulated Database Class dealing with LocalStorage
const STORAGE_KEY = 'bonusmatch_users_db';
const SESSION_KEY = 'bonusmatch_session_user';

class SimulatedDatabase {
  private users: User[] = [];

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === 'undefined') return;
      
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        this.users = JSON.parse(data);
      } catch (e) {
        this.users = [];
      }
    }
  }

  save() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.users));
  }

  updateUser(userId: string, updates: Partial<User>): User {
     const idx = this.users.findIndex(u => u.id === userId);
     if (idx === -1) throw new Error('User not found');
     
     const updatedUser = { ...this.users[idx], ...updates };
     this.users[idx] = updatedUser;
     this.save();
     return updatedUser;
  }

  // Helper to simulate network delay
  public async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async findUserByEmail(email: string): Promise<User | null> {
    await this.delay(300); // Simulate network
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    await this.delay(500);
    
    // Check if email exists
    const existing = await this.findUserByEmail(user.email);
    if (existing) throw new Error('Email already registered');

    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.save();
    return newUser;
  }
}

// Singleton instance
const db = new SimulatedDatabase();

export const authService = {
  async register(firstName: string, lastName: string, email: string, password: string): Promise<User> {
    // Basic validation
    if (!firstName || !lastName || !email || !password) throw new Error('Missing fields');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');
    
    // In a real app we would hash the password here or on server
    // For simulation we just store it (NOT SAFE FOR PRODUCTION, OK FOR MOCK)
    const passwordHash = btoa(password); // Simple encoding for mock
    
    const user = await db.createUser({
      firstName,
      lastName,
      email,
      passwordHash
    });
    
    this.setSession(user);
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const user = await db.findUserByEmail(email);
    if (!user) throw new Error('Invalid email or password');
    
    // Verify password (mock)
    const passwordHash = btoa(password);
    if (user.passwordHash !== passwordHash) throw new Error('Invalid email or password');
    
    this.setSession(user);
    return user;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  setSession(user: User) {
    // Remove sensitive data from session if needed, but keeping simple for now
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },

  async updateUserData(userId: string, data: { profile?: UserProfile, results?: MatchResult[], isPremium?: boolean }): Promise<User> {
    const user = this.getCurrentUser();
    if (!user || user.id !== userId) throw new Error('User not found or session mismatch');

    await db.delay(200); // Simulate network
    const updatedUser = db.updateUser(userId, data);
    
    // Update session
    this.setSession(updatedUser);
    return updatedUser;
  },

  async upgradeToPremium(userId: string): Promise<User> {
    return this.updateUserData(userId, { isPremium: true });
  }
};
