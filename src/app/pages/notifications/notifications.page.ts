import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonMenuButton, IonButtons, IonIcon,
  IonRefresher, IonRefresherContent, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOffOutline, checkmarkDoneOutline, logOutOutline,
  megaphoneOutline, musicalNotesOutline, swapHorizontalOutline,
  personAddOutline, chatbubbleOutline,
} from 'ionicons/icons';
import { NotificationsService } from '../../services/notifications.service';
import { AuthService } from '../../services/auth.service';
import { AppNotification } from '../../interfaces/notification.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonList, IonItem, IonLabel, IonMenuButton, IonButtons, IonIcon,
    IonRefresher, IonRefresherContent,
  ],
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  notifications: AppNotification[] = [];
  unreadCount = 0;

  constructor(
    private notificationsService: NotificationsService,
    private authService: AuthService,
    private router: Router,
  ) {
    addIcons({
      notificationsOffOutline, checkmarkDoneOutline, logOutOutline,
      megaphoneOutline, musicalNotesOutline, swapHorizontalOutline,
      personAddOutline, chatbubbleOutline,
    });
  }

  ngOnInit() {
    this.loadNotifications();
  }

  ionViewWillEnter() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.notificationsService.findAll().subscribe({
      next: (data) => {
        this.notifications = data;
        this.unreadCount = data.filter((n) => !n.isRead).length;
      },
    });
  }

  onNotificationTap(notification: AppNotification) {
    if (!notification.isRead) {
      this.notificationsService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.notificationsService.refreshUnreadCount();
        },
      });
    }

    if (notification.relatedEntityId && notification.relatedEntityType) {
      this.navigateToEntity(notification.relatedEntityType, notification.relatedEntityId);
    }
  }

  markAllAsRead() {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach((n) => (n.isRead = true));
        this.unreadCount = 0;
        this.notificationsService.refreshUnreadCount();
      },
    });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'ANNOUNCEMENT':
        return 'megaphone-outline';
      case 'LINEUP_SUBMITTED':
      case 'LINEUP_APPROVED':
      case 'LINEUP_REJECTED':
      case 'LINEUP_MEMBER_REMOVED':
      case 'LINEUP_CHANGES_REQUESTED':
        return 'musical-notes-outline';
      case 'SUBSTITUTION_REQUEST':
      case 'SUBSTITUTION_APPROVED':
      case 'SUBSTITUTION_REJECTED':
        return 'swap-horizontal-outline';
      case 'USER_APPROVED':
        return 'person-add-outline';
      default:
        return 'chatbubble-outline';
    }
  }

  handleRefresh(event: any) {
    this.loadNotifications();
    setTimeout(() => event.target.complete(), 1000);
  }

  private navigateToEntity(entityType: string, entityId: string) {
    switch (entityType) {
      case 'announcement':
        this.router.navigate(['/announcements']);
        break;
      case 'worship-lineup':
        this.router.navigate(['/worship-lineups', entityId]);
        break;
      default:
        break;
    }
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
