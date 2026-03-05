import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonBadge, IonMenuButton, IonButtons,
  IonFab, IonFabButton, IonIcon,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, logOutOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { PrayerRequestsService } from '../../services/prayer-requests.service';
import { AuthService } from '../../services/auth.service';
import { PrayerRequest } from '../../interfaces/prayer-request.interface';

@Component({
  selector: 'app-prayer-requests-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonList, IonItem, IonLabel, IonBadge, IonMenuButton, IonButtons,
    IonFab, IonFabButton, IonIcon,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
  ],
  templateUrl: './prayer-requests-list.page.html',
  styleUrls: ['./prayer-requests-list.page.scss'],
})
export class PrayerRequestsListPage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  prayerRequests: PrayerRequest[] = [];
  pendingRequests: PrayerRequest[] = [];
  isAdminOrPastor = false;
  currentUserId: string | null = null;
  apiUrl = environment.apiUrl;

  constructor(
    private prayerRequestsService: PrayerRequestsService,
    private authService: AuthService,
    private router: Router,
  ) {
    addIcons({ addOutline, logOutOutline });
  }

  ngOnInit() {
    this.isAdminOrPastor = this.authService.hasRole('PASTOR') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');
    this.currentUserId = this.authService.currentUser?.id ?? null;
    this.loadPrayerRequests();
    if (this.isAdminOrPastor) {
      this.loadPendingRequests();
    }
  }

  ionViewWillEnter() {
    this.currentUserId = this.authService.currentUser?.id ?? null;
    this.loadPrayerRequests();
    if (this.isAdminOrPastor) {
      this.loadPendingRequests();
    }
  }

  loadPrayerRequests() {
    this.prayerRequestsService.findAll().subscribe({
      next: (data) => this.prayerRequests = data,
    });
  }

  loadPendingRequests() {
    this.prayerRequestsService.findPending().subscribe({
      next: (data) => this.pendingRequests = data,
    });
  }

  approveRequest(id: string) {
    this.prayerRequestsService.approve(id).subscribe({
      next: () => {
        this.loadPrayerRequests();
        this.loadPendingRequests();
      },
    });
  }

  getImageUrl(imagePath: string): string {
    return `${this.apiUrl}/uploads/prayer-request-images/${imagePath}`;
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
