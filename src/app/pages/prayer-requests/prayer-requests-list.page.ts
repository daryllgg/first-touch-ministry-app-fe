import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonBadge, IonMenuButton, IonButtons,
  IonFab, IonFabButton, IonIcon,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
  IonSkeletonText, ViewWillEnter,
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
    IonSkeletonText,
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
  isLoading = true;
  private loadCount = 0;

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
    this.loadAll();
  }

  ionViewWillEnter() {
    this.currentUserId = this.authService.currentUser?.id ?? null;
    this.loadAll();
  }

  private loadAll() {
    this.isLoading = true;
    this.loadCount = this.isAdminOrPastor ? 2 : 1;
    this.loadPrayerRequests();
    if (this.isAdminOrPastor) {
      this.loadPendingRequests();
    }
  }

  private checkLoaded() {
    if (--this.loadCount <= 0) this.isLoading = false;
  }

  loadPrayerRequests() {
    this.prayerRequestsService.findAll().subscribe({
      next: (data) => { this.prayerRequests = data; this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });
  }

  loadPendingRequests() {
    this.prayerRequestsService.findPending().subscribe({
      next: (data) => { this.pendingRequests = data; this.checkLoaded(); },
      error: () => this.checkLoaded(),
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
