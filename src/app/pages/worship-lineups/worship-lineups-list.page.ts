import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonMenuButton, IonButtons,
  IonFab, IonFabButton, IonIcon, IonBadge, IonNote, IonRefresher, IonRefresherContent, IonSkeletonText, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, logOutOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { WorshipLineupsService } from '../../services/worship-lineups.service';
import { AuthService } from '../../services/auth.service';
import { WorshipLineup } from '../../interfaces/worship-lineup.interface';

@Component({
  selector: 'app-worship-lineups-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonList, IonItem, IonLabel, IonMenuButton, IonButtons,
    IonFab, IonFabButton, IonIcon, IonBadge, IonNote, IonRefresher, IonRefresherContent, IonSkeletonText,
  ],
  templateUrl: './worship-lineups-list.page.html',
  styleUrls: ['./worship-lineups-list.page.scss'],
})
export class WorshipLineupsListPage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  lineups: WorshipLineup[] = [];
  canCreate = false;
  isLoading = true;

  constructor(
    private lineupsService: WorshipLineupsService,
    private authService: AuthService,
    private router: Router,
  ) {
    addIcons({ addOutline, logOutOutline });
  }

  ngOnInit() {
    this.canCreate = this.authService.hasRole('WORSHIP_LEADER') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');
    this.loadLineups();
  }

  ionViewWillEnter() {
    this.loadLineups();
  }

  loadLineups() {
    this.isLoading = true;
    this.lineupsService.findAll().subscribe({
      next: (data) => { this.lineups = data; this.isLoading = false; },
      error: () => this.isLoading = false,
    });
  }

  formatServiceType(type: string): string {
    switch (type) {
      case 'SUNDAY_SERVICE': return 'Sunday Service';
      case 'PLUG_IN_WORSHIP': return 'Plug In Worship';
      case 'YOUTH_SERVICE': return 'Youth Service';
      case 'SPECIAL_EVENT': return 'Special Event';
      default: return type;
    }
  }

  formatDates(dates: string[]): string {
    if (!dates || dates.length === 0) return '';
    return dates
      .map((d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
      .join(', ');
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'CHANGES_REQUESTED': return 'warning';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    if (status === 'CHANGES_REQUESTED') return 'Changes Requested';
    return status;
  }

  handleRefresh(event: any) {
    this.loadLineups();
    setTimeout(() => event.target.complete(), 1000);
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
