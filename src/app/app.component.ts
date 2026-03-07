import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import {
  IonApp, IonRouterOutlet, IonMenu, IonMenuToggle,
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonIcon, IonLabel, IonBadge,
  MenuController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, megaphoneOutline, handLeftOutline,
  musicalNotesOutline, listOutline, settingsOutline, logOutOutline, personCircleOutline,
  notificationsOutline, peopleOutline, menuOutline, heartOutline, newspaperOutline,
} from 'ionicons/icons';
import { AuthService } from './services/auth.service';
import { PinService } from './services/pin.service';
import { PushNotificationService } from './services/push-notifications.service';
import { NotificationsService } from './services/notifications.service';
import { LoadingService } from './services/loading.service';
import { User } from './interfaces/user.interface';
import { AppNotification } from './interfaces/notification.interface';
import { Subscription, filter } from 'rxjs';
import { environment } from '../environments/environment';
import { ToastContainerComponent } from './components/toast/toast-container.component';
import { ModalComponent } from './components/modal/modal.component';
import { ModalService } from './components/modal/modal.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonApp, IonRouterOutlet, IonMenu, IonMenuToggle,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonIcon, IonLabel, IonBadge,
    ToastContainerComponent, ModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  apiUrl = environment.apiUrl;
  isWeb = environment.platform === 'web';
  currentUser: User | null = null;
  isAdmin = false;
  unreadCount = 0;
  showBottomTabs = false;
  showWebShell = false;
  activeTab = '';

  // Mobile sidebar drawer (web responsive)
  sidebarOpen = false;

  // Profile menu
  showProfileMenu = false;

  // Notification popup
  showNotifPopup = false;
  recentNotifications: AppNotification[] = [];

  private userSub?: Subscription;
  private notifSub?: Subscription;
  private routerSub?: Subscription;

  constructor(
    private authService: AuthService,
    private pinService: PinService,
    private pushNotificationService: PushNotificationService,
    private notificationsService: NotificationsService,
    private modalService: ModalService,
    public loadingService: LoadingService,
    private router: Router,
    private menuCtrl: MenuController,
  ) {
    addIcons({
      homeOutline, megaphoneOutline, handLeftOutline,
      musicalNotesOutline, listOutline, settingsOutline, logOutOutline, personCircleOutline,
      notificationsOutline, peopleOutline, menuOutline, heartOutline, newspaperOutline,
    });
  }

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isAdmin = user?.roles?.some(
        (r) => r.name === 'ADMIN' || r.name === 'SUPER_ADMIN'
      ) ?? false;
      this.updateBottomTabs();
      if (user) {
        this.pushNotificationService.initialize();
      }
    });
    this.notifSub = this.notificationsService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });
    this.routerSub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    ).subscribe((e) => {
      this.activeTab = e.urlAfterRedirects.split('?')[0];
      this.sidebarOpen = false;
      this.updateBottomTabs();
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    this.notifSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showProfileMenu = false;
    this.showNotifPopup = false;
  }

  private updateBottomTabs() {
    const hiddenRoutes = ['/login', '/register', '/verify-email', '/pending'];
    const onAuthRoute = hiddenRoutes.includes(this.activeTab);
    this.showBottomTabs = this.currentUser?.accountStatus === 'APPROVED' && !onAuthRoute;
    this.showWebShell = !!this.currentUser && !onAuthRoute;
  }

  getProfilePicUrl(pic: string): string {
    if (!pic) return '';
    return `${this.apiUrl}/uploads/${pic}`;
  }

  async openMenu() {
    await this.menuCtrl.open();
  }

  // Profile menu
  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.showNotifPopup = false;
    this.showProfileMenu = !this.showProfileMenu;
  }

  // Notification popup
  toggleNotifPopup(event: Event) {
    event.stopPropagation();
    this.showProfileMenu = false;
    this.showNotifPopup = !this.showNotifPopup;
    if (this.showNotifPopup) {
      this.loadRecentNotifications();
    }
  }

  private loadRecentNotifications() {
    this.notificationsService.findAll().subscribe({
      next: (notifs) => {
        this.recentNotifications = notifs.slice(0, 10);
      },
    });
  }

  openNotification(notif: AppNotification) {
    if (!notif.isRead) {
      this.notificationsService.markAsRead(notif.id).subscribe({
        next: () => this.notificationsService.refreshUnreadCount(),
      });
    }
    this.showNotifPopup = false;
    if (notif.relatedEntityType) {
      switch (notif.relatedEntityType) {
        case 'worship-lineup':
          this.router.navigate(['/worship-lineups', notif.relatedEntityId]);
          break;
        case 'article':
          this.router.navigate(['/articles', notif.relatedEntityId]);
          break;
        case 'announcement':
          this.router.navigate(['/announcements']);
          break;
        case 'prayer-request':
          this.router.navigate(['/prayer-requests']);
          break;
        case 'user':
          this.router.navigate(['/profile']);
          break;
        case 'profile-change-request':
          this.router.navigate(['/admin']);
          break;
        default:
          this.router.navigate(['/notifications']);
      }
    } else {
      this.router.navigate(['/notifications']);
    }
  }

  markAllRead() {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.recentNotifications = this.recentNotifications.map(n => ({ ...n, isRead: true }));
        this.notificationsService.refreshUnreadCount();
      },
    });
  }

  // Logout
  async confirmLogout() {
    this.showProfileMenu = false;
    const confirmed = await this.modalService.confirm({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      confirmColor: 'danger',
    });
    if (confirmed) {
      await this.logout();
    }
  }

  async logout() {
    await this.pushNotificationService.unregister();
    this.pinService.clearVerification();
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
