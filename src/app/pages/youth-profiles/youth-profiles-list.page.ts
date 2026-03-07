import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonMenuButton, IonButtons, IonFab, IonFabButton, IonIcon,
  IonSearchbar, IonAvatar, IonLabel, IonList, IonItem, IonBadge, IonSkeletonText, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, logOutOutline, personOutline } from 'ionicons/icons';
import { YouthProfilesService } from '../../services/youth-profiles.service';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../components/toast/toast.service';
import { YouthProfile, Station } from '../../interfaces/youth-profile.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-youth-profiles-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonMenuButton, IonButtons, IonFab, IonFabButton, IonIcon,
    IonSearchbar, IonAvatar, IonLabel, IonList, IonItem, IonBadge, IonSkeletonText,
  ],
  templateUrl: './youth-profiles-list.page.html',
  styleUrls: ['./youth-profiles-list.page.scss'],
})
export class YouthProfilesListPage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  profiles: YouthProfile[] = [];
  filteredProfiles: YouthProfile[] = [];
  searchTerm = '';
  canCreate = false;
  apiUrl = environment.apiUrl;
  isLoading = true;

  // Station tabs
  stations: Station[] = [];
  activeStationTab = 'all';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 50];

  // Attendance
  attendanceMode = false;
  attendanceDate = '';
  attendanceEntries = new Map<string, { present: boolean; notes: string }>();
  isSubmittingAttendance = false;

  constructor(
    private youthProfilesService: YouthProfilesService,
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router,
  ) {
    addIcons({ addOutline, logOutOutline, personOutline });
  }

  ngOnInit() {
    this.canCreate = this.authService.hasRole('PASTOR') ||
      this.authService.hasRole('LEADER') ||
      this.authService.hasRole('OUTREACH_WORKER') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');
    this.loadProfiles();
    this.loadStations();
  }

  ionViewWillEnter() {
    this.loadProfiles();
  }

  loadProfiles() {
    this.isLoading = true;
    this.youthProfilesService.findAll().subscribe({
      next: (data) => {
        this.profiles = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  loadStations() {
    this.youthProfilesService.getStations().subscribe({
      next: (data) => this.stations = data,
    });
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilter();
  }

  onStationTabChange(tab: string) {
    this.activeStationTab = tab;
    this.currentPage = 1;
    this.attendanceMode = false;
    this.applyFilter();
  }

  get isStationSelected(): boolean {
    return this.activeStationTab !== 'all' && this.activeStationTab !== 'analytics';
  }

  applyFilter() {
    let result = [...this.profiles];

    // Station filter
    if (this.activeStationTab !== 'all' && this.activeStationTab !== 'analytics') {
      result = result.filter(p => p.station?.id === this.activeStationTab);
    }

    // Search filter
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
        (p.nickname && p.nickname.toLowerCase().includes(term)) ||
        (p.station?.name && p.station.name.toLowerCase().includes(term))
      );
    }

    this.filteredProfiles = result;
  }

  // Pagination
  get paginatedProfiles(): YouthProfile[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProfiles.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProfiles.length / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  // Attendance
  toggleAttendanceMode() {
    this.attendanceMode = !this.attendanceMode;
    if (this.attendanceMode) {
      this.attendanceDate = new Date().toISOString().split('T')[0];
      this.attendanceEntries = new Map();
      for (const p of this.filteredProfiles) {
        this.attendanceEntries.set(p.id, { present: true, notes: '' });
      }
    }
  }

  get allPresent(): boolean {
    for (const entry of this.attendanceEntries.values()) {
      if (!entry.present) return false;
    }
    return true;
  }

  toggleAllPresent(checked: boolean) {
    for (const entry of this.attendanceEntries.values()) {
      entry.present = checked;
    }
  }

  togglePresent(profileId: string) {
    const entry = this.attendanceEntries.get(profileId);
    if (entry) entry.present = !entry.present;
  }

  updateNotes(profileId: string, notes: string) {
    const entry = this.attendanceEntries.get(profileId);
    if (entry) entry.notes = notes;
  }

  submitAttendance() {
    if (!this.attendanceDate) {
      this.toast.error('Please select a date');
      return;
    }
    this.isSubmittingAttendance = true;
    const entries = this.filteredProfiles.map(p => ({
      youthProfileId: p.id,
      present: this.attendanceEntries.get(p.id)?.present ?? true,
      notes: this.attendanceEntries.get(p.id)?.notes || undefined,
    }));
    this.attendanceService.create({
      date: this.attendanceDate,
      stationId: this.activeStationTab,
      entries,
    }).subscribe({
      next: () => {
        this.toast.success('Attendance recorded successfully');
        this.attendanceMode = false;
        this.isSubmittingAttendance = false;
      },
      error: () => {
        this.toast.error('Failed to record attendance');
        this.isSubmittingAttendance = false;
      },
    });
  }

  getAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  getPhotoUrl(photo: string | undefined): string | null {
    if (!photo) return null;
    return `${this.apiUrl}/uploads/${photo}`;
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
