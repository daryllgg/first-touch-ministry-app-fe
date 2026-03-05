import { User } from './user.interface';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  images?: string[];
  audience?: 'PUBLIC' | 'WORSHIP_TEAM' | 'OUTREACH';
  author: User;
  mentionedUsers?: User[];
  createdAt: string;
  updatedAt: string;
}
