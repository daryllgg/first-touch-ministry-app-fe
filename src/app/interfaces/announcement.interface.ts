import { User } from './user.interface';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}
