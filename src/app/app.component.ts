import { Component, OnDestroy, OnInit } from '@angular/core';
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
  notificationsOutline, peopleOutline, menuOutline,
} from 'ionicons/icons';
import { AuthService } from './services/auth.service';
import { PushNotificationService } from './services/push-notifications.service';
import { NotificationsService } from './services/notifications.service';
import { User } from './interfaces/user.interface';
import { Subscription, filter } from 'rxjs';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonApp, IonRouterOutlet, IonMenu, IonMenuToggle,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonIcon, IonLabel, IonBadge,
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
  activeTab = '';
  private userSub?: Subscription;
  private notifSub?: Subscription;
  private routerSub?: Subscription;

  constructor(
    private authService: AuthService,
    private pushNotificationService: PushNotificationService,
    private notificationsService: NotificationsService,
    private router: Router,
    private menuCtrl: MenuController,
  ) {
    addIcons({
      homeOutline, megaphoneOutline, handLeftOutline,
      musicalNotesOutline, listOutline, settingsOutline, logOutOutline, personCircleOutline,
      notificationsOutline, peopleOutline, menuOutline,
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
      this.updateBottomTabs();
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    this.notifSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  private updateBottomTabs() {
    const hiddenRoutes = ['/login', '/register', '/verify-email', '/pending'];
    this.showBottomTabs = !!this.currentUser?.isApproved &&
      !hiddenRoutes.includes(this.activeTab);
  }

  getProfilePicUrl(pic: string): string {
    if (!pic) return '';
    return `${this.apiUrl}/uploads/${pic}`;
  }

  async openMenu() {
    await this.menuCtrl.open();
  }

  async logout() {
    await this.pushNotificationService.unregister();
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
