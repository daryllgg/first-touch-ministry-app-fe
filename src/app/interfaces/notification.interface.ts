export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
}
