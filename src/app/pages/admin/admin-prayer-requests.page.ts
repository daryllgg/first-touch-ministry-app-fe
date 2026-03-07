import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
  IonList, IonItem, IonLabel, IonBackButton, IonSkeletonText,
  IonRefresher, IonRefresherContent,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user.interface';
import { ToastService } from '../../components/toast/toast.service';

interface PrayerRequest {
  id: string;
  title: string;
  content: string;
  author: User;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-prayer-requests',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
    IonList, IonItem, IonLabel, IonBackButton, IonSkeletonText,
    IonRefresher, IonRefresherContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/admin"></ion-back-button>
        </ion-buttons>
        <ion-title>Prayer Requests</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="admin-content">
        @if (isLoading) {
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-card">
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-text"></div>
              <div class="skeleton skeleton-text-sm"></div>
            </div>
          }
        } @else {
          <h2 class="section-title">Pending Prayer Requests</h2>
          @if (pendingPrayerRequests.length === 0) {
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <p>No pending prayer requests.</p>
            </div>
          } @else {
            @for (pr of pendingPrayerRequests; track pr.id) {
              <div class="request-card">
                <div class="request-info">
                  <div class="request-title">{{ pr.title }}</div>
                  <div class="request-content">{{ pr.content.length > 120 ? pr.content.substring(0, 120) + '...' : pr.content }}</div>
                  <div class="request-meta">By {{ pr.author.firstName }} {{ pr.author.lastName }}</div>
                </div>
                <div class="request-actions">
                  <ion-button color="success" size="small" (click)="approvePrayerRequest(pr.id)">
                    Approve
                  </ion-button>
                  <ion-button color="danger" size="small" fill="outline" (click)="rejectPrayerRequest(pr.id)">
                    Reject
                  </ion-button>
                </div>
              </div>
            }
          }
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .admin-content {
      padding: 16px;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a3a4a;
      margin: 0 0 16px;
    }

    .skeleton-card {
      background: white;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    }

    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
    }

    .skeleton-title {
      height: 18px;
      width: 50%;
      margin-bottom: 10px;
    }

    .skeleton-text {
      height: 14px;
      width: 80%;
      margin-bottom: 8px;
    }

    .skeleton-text-sm {
      height: 12px;
      width: 35%;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .request-card {
      background: white;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    }

    .request-info {
      margin-bottom: 12px;
    }

    .request-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 6px;
    }

    .request-content {
      font-size: 0.85rem;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 8px;
    }

    .request-meta {
      font-size: 0.78rem;
      color: #94a3b8;
    }

    .request-actions {
      display: flex;
      gap: 8px;
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;
    }

    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: #94a3b8;

      svg {
        margin-bottom: 12px;
        opacity: 0.5;
      }

      p {
        font-size: 0.9rem;
        margin: 0;
      }
    }
  `],
})
export class AdminPrayerRequestsPage implements OnInit, ViewWillEnter {
  apiUrl = environment.apiUrl;
  isLoading = true;
  pendingPrayerRequests: PrayerRequest[] = [];

  constructor(
    private http: HttpClient,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadPendingPrayerRequests();
  }

  ionViewWillEnter() {
    this.loadPendingPrayerRequests();
  }

  doRefresh(event: any) {
    this.loadPendingPrayerRequests();
    setTimeout(() => event.target.complete(), 1000);
  }

  loadPendingPrayerRequests() {
    this.isLoading = true;
    this.http.get<PrayerRequest[]>(`${this.apiUrl}/prayer-requests/pending`).subscribe({
      next: (data) => { this.pendingPrayerRequests = data; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  approvePrayerRequest(id: string) {
    this.http.patch(`${this.apiUrl}/prayer-requests/${id}/approve`, {}).subscribe({
      next: () => {
        this.toast.success('Prayer request approved.');
        this.loadPendingPrayerRequests();
      },
      error: () => {
        this.toast.error('Failed to approve prayer request.');
      },
    });
  }

  rejectPrayerRequest(id: string) {
    this.http.patch(`${this.apiUrl}/prayer-requests/${id}/reject`, {}).subscribe({
      next: () => {
        this.toast.warning('Prayer request rejected.');
        this.loadPendingPrayerRequests();
      },
      error: () => {
        this.toast.error('Failed to reject prayer request.');
      },
    });
  }
}
