import { User } from './user.interface';

export interface FeedbackReply {
  id: string;
  user: User;
  message: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  user: User;
  category: 'BUG_REPORT' | 'FEATURE_REQUEST' | 'GENERAL';
  subject: string;
  description: string;
  screenshot: string | null;
  status: 'OPEN' | 'RESOLVED';
  replies: FeedbackReply[];
  createdAt: string;
  updatedAt: string;
}
