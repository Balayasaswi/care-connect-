
export type Role = 'user' | 'assistant';
export type MentalHealthStatus = 'HAPPY' | 'GOOD' | 'NEUTRAL' | 'BAD' | 'CRITICAL';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  startTime: string;
  updatedAt: string;
  isLocked: boolean;
}

export interface JournalFile {
  id: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  title: string;
  summary: string;
  keywords: string[];
  mentalHealth: MentalHealthStatus;
  ipfs_cid: string;
  blockchain_tx: string;
  createdAt: string;
}
