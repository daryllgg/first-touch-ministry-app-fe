import { User } from './user.interface';

export interface PrayerRequest {
  id: string;
  content: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  author: User;
  createdAt: string;
  updatedAt: string;
}
