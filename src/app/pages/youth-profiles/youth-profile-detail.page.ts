import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonBackButton, IonButtons, IonButton, IonIcon,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonSpinner, IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline, personOutline, callOutline,
  locationOutline, logoFacebook, documentTextOutline, peopleOutline,
} from 'ionicons/icons';
import { YouthProfilesService } from '../../services/youth-profiles.service';
import { AuthService } from '../../services/auth.service';
import { YouthProfile } from '../../interfaces/youth-profile.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-youth-profile-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonBackButton, IonButtons, IonButton, IonIcon,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonList, IonItem, IonLabel, IonSpinner, IonBadge,
  ],
  templateUrl: './youth-profile-detail.page.html',
  styleUrls: ['./youth-profile-detail.page.scss'],
})
export class YouthProfileDetailPage implements OnInit {
  isWeb = environment.platform === 'web';
  profile: YouthProfile | null = null;
  isLoading = true;
  canEdit = false;
  apiUrl = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private youthProfilesService: YouthProfilesService,
    private authService: AuthService,
  ) {
    addIcons({
      createOutline, personOutline, callOutline,
      locationOutline, logoFacebook, documentTextOutline, peopleOutline,
    });
  }

  ngOnInit() {
    this.canEdit = this.authService.hasRole('PASTOR') ||
      this.authService.hasRole('LEADER') ||
      this.authService.hasRole('OUTREACH_WORKER') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProfile(id);
    }
  }

  loadProfile(id: string) {
    this.isLoading = true;
    this.youthProfilesService.findOne(id).subscribe({
      next: (data) => {
        this.profile = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
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
