import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private apiUrl = environment.apiUrl;
  private currentToken: string | null = null;

  constructor(
    private http: HttpClient,
    private platform: Platform,
    private router: Router,
  ) {}

  async initialize() {
    if (!this.platform.is('capacitor')) return;

    try {
      const { PushNotifications } = await import(
        '@capacitor/push-notifications'
      );

      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') return;

      await PushNotifications.register();

      PushNotifications.addListener('registration', (token) => {
        this.currentToken = token.value;
        this.registerToken(token.value);
      });

      PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          console.log('Push received in foreground:', notification);
        },
      );

      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action) => {
          const data = action.notification.data;
          if (data?.relatedEntityType && data?.relatedEntityId) {
            const route = this.getRouteForEntity(data.relatedEntityType, data.relatedEntityId);
            this.router.navigate(route);
          }
        },
      );
    } catch (error) {
      console.warn('Push notifications not available:', error);
    }
  }

  private registerToken(token: string) {
    const platform = this.getPlatform();
    this.http
      .post(`${this.apiUrl}/push-notifications/register`, { token, platform })
      .subscribe();
  }

  async unregister() {
    if (!this.platform.is('capacitor') || !this.currentToken) return;

    try {
      this.http
        .delete(`${this.apiUrl}/push-notifications/unregister`, {
          body: { token: this.currentToken },
        })
        .subscribe();
    } catch (error) {
      console.warn('Error unregistering push token:', error);
    }
  }

  private getRouteForEntity(entityType: string, entityId: string): string[] {
    switch (entityType) {
      case 'WORSHIP_LINEUP': return ['/worship-lineups', entityId];
      case 'ARTICLE': return ['/articles', entityId];
      case 'PRAYER_REQUEST': return ['/prayer-requests'];
      case 'PROFILE_CHANGE': return ['/profile'];
      default: return ['/notifications'];
    }
  }

  private getPlatform(): string {
    if (this.platform.is('ios')) return 'ios';
    if (this.platform.is('android')) return 'android';
    return 'web';
  }
}
