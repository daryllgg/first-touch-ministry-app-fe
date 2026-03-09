import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonMenuButton, IonButtons,
  IonFab, IonFabButton, IonIcon, IonBadge, IonNote, IonRefresher, IonRefresherContent, IonSkeletonText,
  IonSegment, IonSegmentButton, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, logOutOutline, musicalNotesOutline, peopleOutline, swapHorizontalOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { WorshipLineupsService } from '../../services/worship-lineups.service';
import { AuthService } from '../../services/auth.service';
import { WorshipLineup, SubstitutionRequest } from '../../interfaces/worship-lineup.interface';

@Component({
  selector: 'app-worship-lineups-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonList, IonItem, IonLabel, IonMenuButton, IonButtons,
    IonFab, IonFabButton, IonIcon, IonBadge, IonNote, IonRefresher, IonRefresherContent, IonSkeletonText,
    IonSegment, IonSegmentButton,
  ],
  templateUrl: './worship-lineups-list.page.html',
  styleUrls: ['./worship-lineups-list.page.scss'],
})
export class WorshipLineupsListPage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  lineups: WorshipLineup[] = [];
  canCreate = false;
  isLoading = true;
  activeTab = 'lineups';

  substitutions: SubstitutionRequest[] = [];
  isLoadingSubstitutions = false;
  isPrivileged = false;
  expandedSubId: string | null = null;

  constructor(
    private lineupsService: WorshipLineupsService,
    private authService: AuthService,
    private router: Router,
  ) {
    addIcons({ addOutline, logOutOutline, musicalNotesOutline, peopleOutline, swapHorizontalOutline });
  }

  ngOnInit() {
    this.canCreate = this.authService.hasRole('WORSHIP_LEADER') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');
    this.isPrivileged = this.authService.hasRole('WORSHIP_TEAM_HEAD') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN') ||
      this.authService.hasRole('DEV');
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

  setTab(tab: string) {
    this.activeTab = tab;
    this.maybeLoadSubs();
  }

  onSegmentChange() {
    this.maybeLoadSubs();
  }

  maybeLoadSubs() {
    if (this.activeTab === 'history' && this.substitutions.length === 0 && !this.isLoadingSubstitutions) {
      this.loadSubstitutions();
    }
  }

  loadSubstitutions() {
    this.isLoadingSubstitutions = true;
    this.lineupsService.findAllSubstitutions().subscribe({
      next: (data) => { this.substitutions = data; this.isLoadingSubstitutions = false; },
      error: () => this.isLoadingSubstitutions = false,
    });
  }

  toggleSub(id: string) {
    this.expandedSubId = this.expandedSubId === id ? null : id;
  }

  getSubStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'HEAD_APPROVED': return 'Head Approved';
      case 'HEAD_REJECTED': return 'Head Rejected';
      case 'ACCEPTED': return 'Accepted';
      case 'DECLINED': return 'Declined';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  }

  getLineupLabel(sub: SubstitutionRequest): string {
    const lineup = sub.lineupMember.lineup;
    if (!lineup) return 'View Lineup';
    if (lineup.serviceType === 'SPECIAL_EVENT' && lineup.customServiceName) return lineup.customServiceName;
    return this.formatServiceType(lineup.serviceType);
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
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

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
