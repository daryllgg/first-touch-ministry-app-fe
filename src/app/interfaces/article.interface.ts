import { User } from './user.interface';

export interface Article {
  id: string;
  title: string;
  caption: string;
  status?: 'DRAFT' | 'PUBLISHED';
  images?: string[];
  author: User;
  mentionedUsers?: User[];
  createdAt: string;
  updatedAt: string;
}
