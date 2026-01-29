
export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date | string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date | string;
  isLocked: boolean; // Historical sessions are locked
}

export interface JournalFile {
  id: string;
  sessionId: string;
  title: string;
  summary: string;
  createdAt: Date | string;
}

export interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  journalFiles: JournalFile[];
  isLoading: boolean;
  error: string | null;
}
