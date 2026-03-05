import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppNotification } from '../interfaces/notification.interface';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationsService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  private userSub?: Subscription;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {
    this.userSub = this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.refreshUnreadCount();
        this.startPolling();
      } else {
        this.stopPolling();
        this.unreadCountSubject.next(0);
      }
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    this.stopPolling();
  }

  private startPolling() {
    this.stopPolling();
    this.pollingInterval = setInterval(() => {
      this.refreshUnreadCount();
    }, 30000);
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  findAll(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.apiUrl);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<AppNotification> {
    return this.http.patch<AppNotification>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/read-all`, {});
  }

  refreshUnreadCount() {
    this.getUnreadCount().subscribe({
      next: (count) => this.unreadCountSubject.next(count),
    });
  }
}
