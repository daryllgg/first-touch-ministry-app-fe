import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonBackButton, IonButtons, IonFab, IonFabButton, IonIcon,
  IonSearchbar, IonAvatar, IonLabel, IonList, IonItem, IonBadge, IonSkeletonText,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, personOutline } from 'ionicons/icons';
import { YouthProfilesService } from '../../services/youth-profiles.service';
import { AuthService } from '../../services/auth.service';
import { YouthProfile } from '../../interfaces/youth-profile.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-youth-all-profiles',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonBackButton, IonButtons, IonFab, IonFabButton, IonIcon,
    IonSearchbar, IonAvatar, IonLabel, IonList, IonItem, IonBadge, IonSkeletonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/youth-profiles"></ion-back-button>
        </ion-buttons>
        <ion-title>All Profiles</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-searchbar
        [(ngModel)]="searchTerm"
        (ionInput)="onSearchChange()"
        placeholder="Search by name or station..."
        debounce="300"
      ></ion-searchbar>

      @if (isLoading) {
        <ion-list>
          @for (i of [1,2,3,4]; track i) {
            <ion-item>
              <ion-avatar slot="start">
                <ion-skeleton-text [animated]="true"></ion-skeleton-text>
              </ion-avatar>
              <ion-label>
                <ion-skeleton-text [animated]="true" style="width:60%;height:16px"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width:40%;height:12px;margin-top:6px"></ion-skeleton-text>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      } @else if (filteredProfiles.length === 0) {
        <div class="empty-state">
          <ion-icon name="person-outline"></ion-icon>
          <p>No youth profiles found.</p>
        </div>
      } @else {
        <ion-list>
          @for (profile of filteredProfiles; track profile.id) {
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
                <p class="meta">{{ profile.station?.name || 'No Station' }} &middot; Age {{ getAge(profile.birthDate) }}</p>
              </ion-label>
              <ion-badge slot="end" [color]="profile.gender === 'MALE' ? 'primary' : 'tertiary'">
                {{ profile.gender }}
              </ion-badge>
            </ion-item>
          }
        </ion-list>

        @if (canCreate) {
          <ion-fab vertical="bottom" horizontal="end" slot="fixed">
            <ion-fab-button routerLink="/youth-profiles/new">
              <ion-icon name="add-outline"></ion-icon>
            </ion-fab-button>
          </ion-fab>
        }
      }
    </ion-content>
  `,
  styleUrls: ['./youth-profiles-list.page.scss'],
})
export class YouthAllProfilesPage implements OnInit, ViewWillEnter {
  profiles: YouthProfile[] = [];
  filteredProfiles: YouthProfile[] = [];
  searchTerm = '';
  canCreate = false;
  apiUrl = environment.apiUrl;
  isLoading = true;

  constructor(
    private youthProfilesService: YouthProfilesService,
    private authService: AuthService,
    private router: Router,
  ) {
    addIcons({ addOutline, personOutline });
  }

  ngOnInit() {
    this.canCreate = this.authService.hasRole('PASTOR') ||
      this.authService.hasRole('LEADER') ||
      this.authService.hasRole('OUTREACH_WORKER') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');
    this.loadProfiles();
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

  onSearchChange() {
    this.applyFilter();
  }

  applyFilter() {
    let result = [...this.profiles];

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
