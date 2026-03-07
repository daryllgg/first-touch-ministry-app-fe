import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
  IonBackButton, IonIcon, IonSkeletonText,
  IonRefresher, IonRefresherContent,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, addOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../components/toast/toast.service';
import { ModalService } from '../../components/modal/modal.service';

interface Station {
  id: string;
  name: string;
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
    IonBackButton, IonIcon, IonSkeletonText,
    IonRefresher, IonRefresherContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/admin"></ion-back-button>
        </ion-buttons>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="admin-content">
        @if (isLoading) {
          <div class="section-header">
            <h2>Stations</h2>
          </div>
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-card">
              <div class="skeleton skeleton-text" style="width:40%"></div>
            </div>
          }
        } @else {
          <div class="section-header">
            <h2>Stations</h2>
            <ion-button size="small" (click)="addStation()">
              <ion-icon name="add-outline" slot="start"></ion-icon>
              Add Station
            </ion-button>
          </div>
          @if (stations.length === 0) {
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <p>No stations configured.</p>
            </div>
          } @else {
            @for (station of stations; track station.id) {
              <div class="station-card">
                <div class="station-name">{{ station.name }}</div>
                <ion-button fill="clear" color="danger" size="small" (click)="removeStation(station)">
                  <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                </ion-button>
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

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0 0 16px;

      h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #1a3a4a;
      }
    }

    .skeleton-card {
      background: white;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 10px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    }

    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
      height: 16px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .station-card {
      background: white;
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 10px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .station-name {
      font-size: 0.95rem;
      font-weight: 500;
      color: #1e293b;
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
export class AdminSettingsPage implements OnInit, ViewWillEnter {
  apiUrl = environment.apiUrl;
  isLoading = true;
  stations: Station[] = [];

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private modal: ModalService,
  ) {
    addIcons({ trashOutline, addOutline });
  }

  ngOnInit() {
    this.loadStations();
  }

  ionViewWillEnter() {
    this.loadStations();
  }

  doRefresh(event: any) {
    this.loadStations();
    setTimeout(() => event.target.complete(), 1000);
  }

  loadStations() {
    this.isLoading = true;
    this.http.get<Station[]>(`${this.apiUrl}/youth-profiles/stations`).subscribe({
      next: (data) => { this.stations = data; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  async addStation() {
    const result = await this.modal.prompt({
      title: 'Add Station',
      inputs: [
        { key: 'name', label: 'Station Name', type: 'text', placeholder: 'Station Name', required: true },
      ],
      confirmText: 'Add',
    });
    if (result && result['name']) {
      this.http.post(`${this.apiUrl}/youth-profiles/stations`, { name: result['name'] }).subscribe({
        next: () => {
          this.toast.success('Station added');
          this.loadStations();
        },
        error: () => {
          this.toast.error('Failed to add station');
        },
      });
    }
  }

  async removeStation(station: Station) {
    const confirmed = await this.modal.confirm({
      title: 'Remove Station',
      message: `Are you sure you want to remove "${station.name}"?`,
      confirmText: 'Remove',
      confirmColor: 'danger',
    });
    if (confirmed) {
      this.http.delete(`${this.apiUrl}/youth-profiles/stations/${station.id}`).subscribe({
        next: () => {
          this.toast.success('Station removed');
          this.loadStations();
        },
        error: () => {
          this.toast.error('Failed to remove station');
        },
      });
    }
  }
}
