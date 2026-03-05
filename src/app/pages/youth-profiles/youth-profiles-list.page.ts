import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonMenuButton, IonButtons, IonFab, IonFabButton, IonIcon,
  IonSearchbar, IonAvatar, IonLabel, IonList, IonItem, IonBadge, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, logOutOutline, personOutline } from 'ionicons/icons';
import { YouthProfilesService } from '../../services/youth-profiles.service';
import { AuthService } from '../../services/auth.service';
import { YouthProfile } from '../../interfaces/youth-profile.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-youth-profiles-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonMenuButton, IonButtons, IonFab, IonFabButton, IonIcon,
    IonSearchbar, IonAvatar, IonLabel, IonList, IonItem, IonBadge,
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

  constructor(
    private youthProfilesService: YouthProfilesService,
    private authService: AuthService,
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
  }

  ionViewWillEnter() {
    this.loadProfiles();
  }

  loadProfiles() {
    this.youthProfilesService.findAll().subscribe({
      next: (data) => {
        this.profiles = data;
        this.applyFilter();
      },
    });
  }

  onSearchChange() {
    this.applyFilter();
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredProfiles = [...this.profiles];
      return;
    }
    this.filteredProfiles = this.profiles.filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
      (p.nickname && p.nickname.toLowerCase().includes(term)) ||
      (p.station?.name && p.station.name.toLowerCase().includes(term))
    );
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
