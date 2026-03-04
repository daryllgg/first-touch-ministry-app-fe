import { User } from './user.interface';

export interface WorshipSchedule {
  id: string;
  title: string;
  description: string;
  scheduledDate: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}
