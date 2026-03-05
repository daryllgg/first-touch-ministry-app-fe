import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonApp, IonRouterOutlet, IonMenu, IonMenuToggle,
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonIcon, IonLabel, IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, megaphoneOutline, handLeftOutline,
  musicalNotesOutline, listOutline, settingsOutline, logOutOutline, personCircleOutline,
  notificationsOutline, peopleOutline,
} from 'ionicons/icons';
import { AuthService } from './services/auth.service';
import { PushNotificationService } from './services/push-notifications.service';
import { NotificationsService } from './services/notifications.service';
import { User } from './interfaces/user.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonApp, IonRouterOutlet, IonMenu, IonMenuToggle,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonIcon, IonLabel, IonBadge,
  ],
  template: `
    <ion-app>
      @if (currentUser) {
        <ion-menu contentId="main-content" type="overlay">
          <ion-header>
            <ion-toolbar color="secondary">
              <div class="menu-header-content">
                <img src="assets/logos/FTM Logomark.png" alt="FTM" class="menu-logo" />
                <span class="menu-app-name">First Touch Ministry</span>
              </div>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <div class="menu-user-info">
              <ion-icon name="person-circle-outline"></ion-icon>
              <p class="menu-user-name">{{ currentUser.firstName }} {{ currentUser.lastName }}</p>
              <p class="menu-user-email">{{ currentUser.email }}</p>
            </div>
            <ion-list lines="none" class="menu-list">
              <ion-menu-toggle auto-hide="false">
                <ion-item button routerLink="/home" routerLinkActive="active-menu-item" [routerLinkActiveOptions]="{exact: true}">
                  <ion-icon name="home-outline" slot="start"></ion-icon>
                  <ion-label>Home</ion-label>
                </ion-item>
              </ion-menu-toggle>
              <ion-menu-toggle auto-hide="false">
                <ion-item button routerLink="/profile" routerLinkActive="active-menu-item">
                  <ion-icon name="person-circle-outline" slot="start"></ion-icon>
                  <ion-label>My Profile</ion-label>
                </ion-item>
              </ion-menu-toggle>
              <ion-menu-toggle auto-hide="false">
                <ion-item button routerLink="/announcements" routerLinkActive="active-menu-item">
                  <ion-icon name="megaphone-outline" slot="start"></ion-icon>
                  <ion-label>Announcements</ion-label>
                </ion-item>
              </ion-menu-toggle>
              <ion-menu-toggle auto-hide="false">
                <ion-item button routerLink="/prayer-requests" routerLinkActive="active-menu-item">
                  <ion-icon name="hand-left-outline" slot="start"></ion-icon>
                  <ion-label>Prayer Requests</ion-label>
                </ion-item>
              </ion-menu-toggle>
              <ion-menu-toggle auto-hide="false">
                <ion-item button routerLink="/worship-lineups" routerLinkActive="active-menu-item">
                  <ion-icon name="list-outline" slot="start"></ion-icon>
                  <ion-label>Worship Lineups</ion-label>
                </ion-item>
              </ion-menu-toggle>
              <ion-menu-toggle auto-hide="false">
                <ion-item button routerLink="/notifications" routerLinkActive="active-menu-item">
                  <ion-icon name="notifications-outline" slot="start"></ion-icon>
                  <ion-label>Notifications</ion-label>
                  @if (unreadCount > 0) {
                    <ion-badge slot="end" color="danger">{{ unreadCount }}</ion-badge>
                  }
                </ion-item>
              </ion-menu-toggle>
              <ion-menu-toggle auto-hide="false">
                <ion-item button routerLink="/youth-profiles" routerLinkActive="active-menu-item">
                  <ion-icon name="people-outline" slot="start"></ion-icon>
                  <ion-label>Kids and Teens</ion-label>
                </ion-item>
              </ion-menu-toggle>
              @if (isAdmin) {
                <ion-menu-toggle auto-hide="false">
                  <ion-item button routerLink="/admin" routerLinkActive="active-menu-item">
                    <ion-icon name="settings-outline" slot="start"></ion-icon>
                    <ion-label>Admin Panel</ion-label>
                  </ion-item>
                </ion-menu-toggle>
              }
              <ion-menu-toggle auto-hide="false">
                <ion-item button (click)="logout()" class="logout-item">
                  <ion-icon name="log-out-outline" slot="start" color="danger"></ion-icon>
                  <ion-label color="danger">Logout</ion-label>
                </ion-item>
              </ion-menu-toggle>
            </ion-list>
          </ion-content>
        </ion-menu>
      }
      <ion-router-outlet id="main-content"></ion-router-outlet>
    </ion-app>
  `,
  styles: [`
    .menu-header-content {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;

      .menu-logo {
        width: 36px;
        height: 36px;
        object-fit: contain;
      }

      .menu-app-name {
        font-family: 'Playfair Display', serif;
        font-size: 16px;
        font-weight: 600;
        color: white;
      }
    }

    .menu-user-info {
      padding: 24px 16px 16px;
      background: var(--ion-color-primary);
      color: white;
      text-align: center;

      ion-icon {
        font-size: 56px;
        opacity: 0.9;
      }

      .menu-user-name {
        font-size: 16px;
        font-weight: 600;
        margin: 8px 0 2px;
      }

      .menu-user-email {
        font-size: 13px;
        opacity: 0.8;
        margin: 0;
      }
    }

    .menu-list {
      padding-top: 8px;

      ion-item {
        --padding-start: 16px;
        --min-height: 48px;
        margin: 2px 8px;
        border-radius: 8px;
        font-weight: 500;
      }

      ion-icon {
        font-size: 22px;
        margin-right: 12px;
      }
    }

    .active-menu-item {
      --background: #f0fdf4;
      --color: #16a34a;
      color: #16a34a;

      ion-icon {
        color: #16a34a;
      }
    }

    .logout-item {
      margin-top: 16px !important;
    }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isAdmin = false;
  unreadCount = 0;
  private userSub?: Subscription;
  private notifSub?: Subscription;

  constructor(
    private authService: AuthService,
    private pushNotificationService: PushNotificationService,
    private notificationsService: NotificationsService,
    private router: Router,
  ) {
    addIcons({
      homeOutline, megaphoneOutline, handLeftOutline,
      musicalNotesOutline, listOutline, settingsOutline, logOutOutline, personCircleOutline,
      notificationsOutline, peopleOutline,
    });
  }

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isAdmin = user?.roles?.some(
        (r) => r.name === 'ADMIN' || r.name === 'SUPER_ADMIN'
      ) ?? false;
      if (user) {
        this.pushNotificationService.initialize();
      }
    });
    this.notifSub = this.notificationsService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    this.notifSub?.unsubscribe();
  }

  async logout() {
    await this.pushNotificationService.unregister();
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
