import { User } from './user.interface';

export interface PrayerRequest {
  id: string;
  content: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  isApproved?: boolean;
  image?: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}
