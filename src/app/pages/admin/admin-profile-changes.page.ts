import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
  IonBackButton, IonSkeletonText,
  IonRefresher, IonRefresherContent,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user.interface';
import { ProfileService } from '../../services/profile.service';
import { ToastService } from '../../components/toast/toast.service';

interface ProfileChangeRequest {
  id: string;
  user: User;
  requestedChanges: Record<string, any>;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-profile-changes',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
    IonBackButton, IonSkeletonText,
    IonRefresher, IonRefresherContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/admin"></ion-back-button>
        </ion-buttons>
        <ion-title>Profile Changes</ion-title>
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
              <div style="display:flex;gap:6px;margin-top:8px">
                <div class="skeleton skeleton-badge"></div>
                <div class="skeleton skeleton-badge"></div>
              </div>
            </div>
          }
        } @else {
          <h2 class="section-title">Pending Profile Changes</h2>
          @if (pendingProfileChanges.length === 0) {
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <p>No pending profile changes.</p>
            </div>
          } @else {
            @for (request of pendingProfileChanges; track request.id) {
              <div class="change-card">
                <div class="change-user">
                  <div class="change-name">{{ request.user.firstName }} {{ request.user.lastName }}</div>
                  <div class="change-email">{{ request.user.email }}</div>
                </div>
                <div class="change-fields">
                  @for (change of getChangeFields(request.requestedChanges); track change.field) {
                    <span class="change-chip">
                      <strong>{{ change.field }}:</strong>&nbsp;{{ change.value }}
                    </span>
                  }
                </div>
                <div class="change-actions">
                  <ion-button color="success" size="small" (click)="approveProfileChange(request.id)">
                    Approve
                  </ion-button>
                  <ion-button color="danger" size="small" fill="outline" (click)="rejectProfileChange(request.id)">
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
      width: 45%;
      margin-bottom: 10px;
    }

    .skeleton-text {
      height: 14px;
      width: 55%;
      margin-bottom: 8px;
    }

    .skeleton-badge {
      height: 22px;
      width: 80px;
      border-radius: 10px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .change-card {
      background: white;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    }

    .change-user {
      margin-bottom: 10px;
    }

    .change-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
    }

    .change-email {
      font-size: 0.82rem;
      color: #64748b;
      margin-top: 2px;
    }

    .change-fields {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .change-chip {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.75rem;
      background: #e0f2fe;
      color: #1a3a4a;
    }

    .change-actions {
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
export class AdminProfileChangesPage implements OnInit, ViewWillEnter {
  apiUrl = environment.apiUrl;
  isLoading = true;
  pendingProfileChanges: ProfileChangeRequest[] = [];

  constructor(
    private profileService: ProfileService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadPendingProfileChanges();
  }

  ionViewWillEnter() {
    this.loadPendingProfileChanges();
  }

  doRefresh(event: any) {
    this.loadPendingProfileChanges();
    setTimeout(() => event.target.complete(), 1000);
  }

  loadPendingProfileChanges() {
    this.isLoading = true;
    this.profileService.getPendingProfileChanges().subscribe({
      next: (changes) => { this.pendingProfileChanges = changes; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  getChangeFields(changes: Record<string, any>): { field: string; value: any }[] {
    return Object.entries(changes).map(([field, value]) => ({ field, value }));
  }

  approveProfileChange(id: string) {
    this.profileService.approveProfileChange(id).subscribe({
      next: () => {
        this.toast.success('Profile change approved.');
        this.loadPendingProfileChanges();
      },
      error: () => {
        this.toast.error('Failed to approve profile change.');
      },
    });
  }

  rejectProfileChange(id: string) {
    this.profileService.rejectProfileChange(id).subscribe({
      next: () => {
        this.toast.warning('Profile change rejected.');
        this.loadPendingProfileChanges();
      },
      error: () => {
        this.toast.error('Failed to reject profile change.');
      },
    });
  }
}
