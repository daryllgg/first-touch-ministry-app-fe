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
import { AttendanceService } from '../../services/attendance.service';
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

  // Attendance analytics
  totalSessions = 0;
  sessionsPresent = 0;
  attendanceRate = 0;
  monthlyAttendance: { month: string; present: number; total: number }[] = [];
  attendanceLoading = true;

  constructor(
    private route: ActivatedRoute,
    private youthProfilesService: YouthProfilesService,
    private authService: AuthService,
    private attendanceService: AttendanceService,
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
        this.loadAttendance(id);
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  loadAttendance(youthProfileId: string) {
    this.attendanceLoading = true;
    this.attendanceService.findByYouthProfile(youthProfileId).subscribe({
      next: (entries) => {
        this.processAttendanceData(entries);
        this.attendanceLoading = false;
      },
      error: () => {
        this.attendanceLoading = false;
      },
    });
  }

  private processAttendanceData(entries: any[]) {
    this.totalSessions = entries.length;
    this.sessionsPresent = entries.filter(e => e.present).length;
    this.attendanceRate = this.totalSessions > 0
      ? Math.round((this.sessionsPresent / this.totalSessions) * 100)
      : 0;

    // Build monthly buckets for last 6 months
    const now = new Date();
    const months: { month: string; present: number; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      months.push({ month: label, present: 0, total: 0 });

      for (const entry of entries) {
        const entryDate = entry.attendanceRecord?.date || '';
        if (entryDate.startsWith(key)) {
          months[months.length - 1].total++;
          if (entry.present) months[months.length - 1].present++;
        }
      }
    }
    this.monthlyAttendance = months;
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
