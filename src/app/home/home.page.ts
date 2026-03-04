import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonBadge, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { megaphoneOutline, handLeftOutline, musicalNotesOutline, settingsOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { AnnouncementsService } from '../services/announcements.service';
import { WorshipSchedulesService } from '../services/worship-schedules.service';
import { Announcement } from '../interfaces/announcement.interface';
import { WorshipSchedule } from '../interfaces/worship-schedule.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonList, IonItem, IonLabel, IonBadge, IonIcon,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  announcements: Announcement[] = [];
  upcomingSchedules: WorshipSchedule[] = [];
  userName = '';
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private announcementsService: AnnouncementsService,
    private schedulesService: WorshipSchedulesService,
    private router: Router,
  ) {
    addIcons({ megaphoneOutline, handLeftOutline, musicalNotesOutline, settingsOutline, logOutOutline });
  }

  ngOnInit() {
    const user = this.authService.currentUser;
    if (user) {
      this.userName = `${user.firstName} ${user.lastName}`;
      this.isAdmin = this.authService.hasRole('ADMIN') || this.authService.hasRole('SUPER_ADMIN');
    }

    this.announcementsService.findAll().subscribe({
      next: (data) => this.announcements = data.slice(0, 5),
    });

    this.schedulesService.findUpcoming().subscribe({
      next: (data) => this.upcomingSchedules = data.slice(0, 3),
    });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
