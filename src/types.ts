export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface StructuredDevLog {
  title: string;
  rootCause: string;
  resolution: string;
  tags: string[];
  difficulty: number; // 1 to 5
  resolved: boolean;
  language?: string;
  timeSpentMinutes?: number;
}

export interface DevLogDocument extends StructuredDevLog {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  transcriptId: string;
  summaryNote?: string;
}

export interface DevLogTranscript {
  id: string;
  userId: string;
  devLogId?: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
