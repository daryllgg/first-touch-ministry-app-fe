import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonBackButton, IonButtons, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barChartOutline } from 'ionicons/icons';

@Component({
  selector: 'app-youth-analytics',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonBackButton, IonButtons, IonIcon,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/youth-profiles"></ion-back-button>
        </ion-buttons>
        <ion-title>Overall Analytics</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="analytics-placeholder">
        <div class="analytics-placeholder__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
        <h2 class="analytics-placeholder__title">Coming Soon</h2>
        <p class="analytics-placeholder__text">Analytics and insights for Kids and Teens ministry will be available here.</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .analytics-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 80px 24px;
    }

    .analytics-placeholder__icon {
      width: 96px;
      height: 96px;
      border-radius: 24px;
      background: #e8f4f8;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1a3a4a;
      margin-bottom: 24px;
      opacity: 0.7;
    }

    .analytics-placeholder__title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a3a4a;
      margin: 0 0 8px 0;
    }

    .analytics-placeholder__text {
      font-size: 0.95rem;
      color: #64748b;
      margin: 0;
      max-width: 280px;
      line-height: 1.5;
    }
  `],
})
export class YouthAnalyticsPage {
  constructor() {
    addIcons({ barChartOutline });
  }
}
