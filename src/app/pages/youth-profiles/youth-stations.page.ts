import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonBackButton, IonButtons, IonIcon, IonAvatar, IonLabel,
  IonList, IonItem, IonBadge, IonSkeletonText, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, chevronBackOutline, chevronForwardOutline, locationOutline } from 'ionicons/icons';
import { YouthProfilesService } from '../../services/youth-profiles.service';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../components/toast/toast.service';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';
import { YouthProfile, Station } from '../../interfaces/youth-profile.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-youth-stations',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonBackButton, IonButtons, IonIcon, IonAvatar, IonLabel,
    IonList, IonItem, IonBadge, IonSkeletonText,
    DatePickerComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="selectedStation ? null : '/youth-profiles'" (click)="onBackClick($event)"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ selectedStation ? selectedStation.name : 'Stations' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (isLoading) {
        @for (i of [1,2,3]; track i) {
          <div class="station-card-skeleton">
            <div class="skeleton skeleton-icon"></div>
            <div style="flex:1">
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-text"></div>
            </div>
          </div>
        }
      } @else if (!selectedStation) {
        <!-- Station List -->
        @if (stations.length === 0) {
          <div class="empty-state">
            <ion-icon name="location-outline" style="font-size:64px;opacity:0.4"></ion-icon>
            <p>No stations found.</p>
          </div>
        } @else {
          @for (station of stations; track station.id) {
            <div class="station-card" (click)="selectStation(station)">
              <div class="station-card__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div class="station-card__content">
                <span class="station-card__name">{{ station.name }}</span>
                <span class="station-card__count">{{ getProfileCount(station.id) }} {{ getProfileCount(station.id) === 1 ? 'kid' : 'kids' }}</span>
              </div>
              <div class="station-card__chevron">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
          }
        }
      } @else {
        <!-- Kids in selected station -->
        @if (stationProfiles.length === 0) {
          <div class="empty-state">
            <ion-icon name="person-outline" style="font-size:64px;opacity:0.4"></ion-icon>
            <p>No kids in this station.</p>
          </div>
        } @else {
          @if (canRecordAttendance && !attendanceMode) {
            <ion-button expand="block" fill="outline" (click)="toggleAttendanceMode()" style="margin-bottom:12px">
              Record Attendance
            </ion-button>
          }

          @if (attendanceMode) {
            <!-- Attendance Header Card -->
            <div class="mobile-attendance-header">
              <div class="mobile-attendance-date-section">
                <label class="mobile-attendance-label">Attendance Date</label>
                <app-date-picker [value]="attendanceDate" (valueChange)="attendanceDate = $event" [max]="todayDate" placeholder="Select attendance date"></app-date-picker>
              </div>
              <label class="mobile-attendance-mark-all">
                <input type="checkbox" [checked]="allPresent" (change)="markAllPresent($any($event.target).checked)" />
                <span>Mark All Present</span>
              </label>
            </div>

            <!-- Attendance Child Cards -->
            @for (profile of stationProfiles; track profile.id) {
              <div class="mobile-attendance-card" [class.mobile-attendance-card--absent]="attendanceEntries.get(profile.id)?.present === false">
                <div class="mobile-attendance-card__row">
                  <div class="mobile-attendance-card__info">
                    @if (profile.photo) {
                      <img [src]="getPhotoUrl(profile.photo)" class="mobile-attendance-card__avatar" />
                    } @else {
                      <div class="mobile-attendance-card__avatar-placeholder">
                        {{ profile.firstName?.charAt(0) }}{{ profile.lastName?.charAt(0) }}
                      </div>
                    }
                    <div class="mobile-attendance-card__name-group">
                      <span class="mobile-attendance-card__name">{{ profile.firstName }} {{ profile.lastName }}</span>
                      @if (profile.nickname) {
                        <span class="mobile-attendance-card__nickname">"{{ profile.nickname }}"</span>
                      }
                    </div>
                  </div>
                  <input type="checkbox" class="mobile-attendance-checkbox" [checked]="attendanceEntries.get(profile.id)?.present !== false" (change)="togglePresent(profile.id)" />
                </div>
                @if (attendanceEntries.get(profile.id)?.present === false) {
                  <div class="mobile-attendance-card__reason">
                    <label class="mobile-attendance-card__reason-label">Reason for absence</label>
                    <input type="text" class="mobile-attendance-card__reason-input" placeholder="e.g. Sick, out of town..." [value]="attendanceEntries.get(profile.id)?.notes || ''" (input)="updateNotes(profile.id, $any($event.target).value)" />
                  </div>
                }
              </div>
            }

            <!-- Attendance Actions -->
            <div class="mobile-attendance-actions">
              <ion-button fill="outline" expand="block" (click)="toggleAttendanceMode()" class="mobile-attendance-actions__btn">Cancel</ion-button>
              <ion-button expand="block" (click)="submitAttendance()" [disabled]="isSubmittingAttendance || !attendanceDate" class="mobile-attendance-actions__btn">
                @if (isSubmittingAttendance) { Submitting... } @else { Submit }
              </ion-button>
            </div>
          }

          @if (!attendanceMode) {
            <ion-list>
              @for (profile of stationProfiles; track profile.id) {
                <ion-item button [routerLink]="['/youth-profiles', profile.id]" detail>
                  <ion-avatar slot="start">
                    @if (getPhotoUrl(profile.photo)) {
                      <img [src]="getPhotoUrl(profile.photo)" [alt]="profile.firstName" />
                    } @else {
                      <div class="avatar-placeholder">
                        <ion-icon name="person-outline"></ion-icon>
                      </div>
                    }
                  </ion-avatar>
                  <ion-label>
                    <h2>{{ profile.firstName }} {{ profile.lastName }}</h2>
                    @if (profile.nickname) {
                      <p class="nickname">"{{ profile.nickname }}"</p>
                    }
                    <p class="meta">Age {{ getAge(profile.birthDate) }}</p>
                  </ion-label>
                  <ion-badge slot="end" [color]="profile.gender === 'MALE' ? 'primary' : 'tertiary'">
                    {{ profile.gender }}
                  </ion-badge>
                </ion-item>
              }
            </ion-list>
          }
        }
      }
    </ion-content>
  `,
  styles: [`
    .station-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: white;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 10px;
      box-shadow: 0 2px 8px rgba(26, 58, 74, 0.06);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.15s ease, box-shadow 0.15s ease;

      &:active {
        transform: scale(0.98);
        box-shadow: 0 1px 4px rgba(26, 58, 74, 0.08);
      }
    }

    .station-card__icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: #e8f4f8;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1a3a4a;
      flex-shrink: 0;
    }

    .station-card__content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .station-card__name {
      font-weight: 600;
      font-size: 1rem;
      color: #1a3a4a;
    }

    .station-card__count {
      font-size: 0.85rem;
      color: #64748b;
    }

    .station-card__chevron {
      color: #94a3b8;
      flex-shrink: 0;
    }

    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: var(--ion-color-medium);

      p {
        margin-top: 12px;
        font-size: 1em;
      }
    }

    ion-list {
      background: transparent;
    }

    ion-item {
      --background: white;
      border-radius: 10px;
      margin-bottom: 8px;
      box-shadow: 0 1px 6px rgba(26, 58, 74, 0.06);

      h2 {
        color: var(--ion-color-secondary);
        font-weight: 600;
      }

      .nickname {
        font-style: italic;
        color: var(--ion-color-medium);
        font-size: 0.85em;
      }

      .meta {
        font-size: 0.8em;
        color: var(--ion-color-medium);
        margin-top: 4px;
      }
    }

    ion-avatar {
      width: 48px;
      height: 48px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        background: var(--ion-color-light);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        ion-icon {
          font-size: 24px;
          color: var(--ion-color-medium);
        }
      }
    }

    ion-badge {
      font-size: 0.7em;
      text-transform: uppercase;
    }

    .station-card-skeleton {
      display: flex;
      align-items: center;
      gap: 14px;
      background: white;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 10px;
      box-shadow: 0 2px 8px rgba(26, 58, 74, 0.06);
    }

    .skeleton {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
    }

    .skeleton-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      flex-shrink: 0;
    }

    .skeleton-title {
      width: 60%;
      height: 16px;
      margin-bottom: 6px;
    }

    .skeleton-text {
      width: 40%;
      height: 12px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ═══ Mobile Attendance Mode ═══ */

    .mobile-attendance-header {
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .mobile-attendance-date-section {
      margin-bottom: 14px;

      app-date-picker {
        display: block;
        margin-top: 6px;
      }
    }

    .mobile-attendance-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748b;
      margin: 0 0 2px 0;
    }

    .mobile-attendance-mark-all {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;

      input[type="checkbox"] {
        width: 20px;
        height: 20px;
        accent-color: #1a3a4a;
        cursor: pointer;
        flex-shrink: 0;
      }

      span {
        line-height: 1;
      }
    }

    .mobile-attendance-card {
      background: white;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 10px;
      box-shadow: 0 1px 6px rgba(26, 58, 74, 0.06);
      transition: background 0.2s ease;

      &--absent {
        background: #fef2f2;
        border-left: 3px solid #fca5a5;
      }
    }

    .mobile-attendance-card__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .mobile-attendance-card__info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .mobile-attendance-card__avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .mobile-attendance-card__avatar-placeholder {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      flex-shrink: 0;
    }

    .mobile-attendance-card__name-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .mobile-attendance-card__name {
      font-weight: 600;
      color: #1a3a4a;
      font-size: 0.95rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mobile-attendance-card__nickname {
      font-style: italic;
      color: #94a3b8;
      font-size: 0.8rem;
    }

    .mobile-attendance-checkbox {
      width: 24px;
      height: 24px;
      accent-color: #1a3a4a;
      cursor: pointer;
      flex-shrink: 0;
      -webkit-tap-highlight-color: transparent;
    }

    .mobile-attendance-card__reason {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid #fde2e2;
      padding-left: 52px;
    }

    .mobile-attendance-card__reason-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }

    .mobile-attendance-card__reason-input {
      width: 100%;
      padding: 10px 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: 'Inter', sans-serif;
      color: #1e293b;
      background: white;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s;
      -webkit-appearance: none;

      &::placeholder {
        color: #94a3b8;
      }

      &:focus {
        border-color: #1a3a4a;
      }
    }

    .mobile-attendance-actions {
      display: flex;
      gap: 10px;
      margin-top: 18px;
      padding-bottom: 80px;

      .mobile-attendance-actions__btn {
        flex: 1;
      }
    }
  `],
})
export class YouthStationsPage implements OnInit, ViewWillEnter {
  stations: Station[] = [];
  profiles: YouthProfile[] = [];
  selectedStation: Station | null = null;
  stationProfiles: YouthProfile[] = [];
  isLoading = true;
  apiUrl = environment.apiUrl;

  // Attendance
  canRecordAttendance = false;
  attendanceMode = false;
  attendanceDate = '';
  attendanceEntries = new Map<string, { present: boolean; notes: string }>();
  isSubmittingAttendance = false;
  todayDate = new Date().toISOString().split('T')[0];

  constructor(
    private youthProfilesService: YouthProfilesService,
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private toast: ToastService,
  ) {
    addIcons({ personOutline, chevronBackOutline, chevronForwardOutline, locationOutline });
  }

  ngOnInit() {
    this.canRecordAttendance = this.authService.hasRole('PASTOR') ||
      this.authService.hasRole('LEADER') ||
      this.authService.hasRole('OUTREACH_WORKER') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    let stationsLoaded = false;
    let profilesLoaded = false;

    const checkDone = () => {
      if (stationsLoaded && profilesLoaded) {
        this.isLoading = false;
      }
    };

    this.youthProfilesService.getStations().subscribe({
      next: (data) => {
        this.stations = data;
        stationsLoaded = true;
        checkDone();
      },
      error: () => {
        stationsLoaded = true;
        checkDone();
      },
    });

    this.youthProfilesService.findAll().subscribe({
      next: (data) => {
        this.profiles = data;
        profilesLoaded = true;
        checkDone();
        // Refresh station profiles if a station is selected
        if (this.selectedStation) {
          this.stationProfiles = this.profiles.filter(p => p.station?.id === this.selectedStation!.id);
        }
      },
      error: () => {
        profilesLoaded = true;
        checkDone();
      },
    });
  }

  getProfileCount(stationId: string): number {
    return this.profiles.filter(p => p.station?.id === stationId).length;
  }

  selectStation(station: Station) {
    this.selectedStation = station;
    this.stationProfiles = this.profiles.filter(p => p.station?.id === station.id);
  }

  onBackClick(event: Event) {
    if (this.selectedStation) {
      event.preventDefault();
      event.stopPropagation();
      this.attendanceMode = false;
      this.selectedStation = null;
      this.stationProfiles = [];
    }
  }

  // Attendance methods
  toggleAttendanceMode() {
    this.attendanceMode = !this.attendanceMode;
    if (this.attendanceMode) {
      this.attendanceDate = new Date().toISOString().split('T')[0];
      this.attendanceEntries = new Map();
      for (const p of this.stationProfiles) {
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

  markAllPresent(checked: boolean) {
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
    const entries = this.stationProfiles.map(p => ({
      youthProfileId: p.id,
      present: this.attendanceEntries.get(p.id)?.present ?? true,
      notes: this.attendanceEntries.get(p.id)?.notes || undefined,
    }));
    this.attendanceService.create({
      date: this.attendanceDate,
      stationId: this.selectedStation!.id,
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
}
