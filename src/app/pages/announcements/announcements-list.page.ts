import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonMenuButton, IonButtons, IonFab, IonFabButton, IonIcon,
  IonBadge,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, atOutline, logOutOutline, megaphoneOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { AnnouncementsService } from '../../services/announcements.service';
import { AuthService } from '../../services/auth.service';
import { Announcement } from '../../interfaces/announcement.interface';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-announcements-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonMenuButton, IonButtons, IonFab, IonFabButton, IonIcon,
    IonBadge,
  ],
  templateUrl: './announcements-list.page.html',
  styleUrls: ['./announcements-list.page.scss'],
})
export class AnnouncementsListPage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  announcements: Announcement[] = [];
  canCreate = false;
  apiUrl = environment.apiUrl;

  constructor(
    private announcementsService: AnnouncementsService,
    private authService: AuthService,
    private router: Router,
  ) {
    addIcons({ addOutline, atOutline, logOutOutline, megaphoneOutline });
  }

  ngOnInit() {
    this.canCreate = this.authService.hasRole('PASTOR') ||
      this.authService.hasRole('LEADER') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');
    this.loadAnnouncements();
  }

  ionViewWillEnter() {
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.announcementsService.findAll().subscribe({
      next: (data) => this.announcements = data,
    });
  }

  getImageUrl(imagePath: string): string {
    return `${this.apiUrl}/uploads/${imagePath}`;
  }

  truncateContent(content: string): string {
    if (content.length <= 100) return content;
    return content.substring(0, 100) + '...';
  }

  getMentionedNames(users: User[]): string {
    return users.map(u => `${u.firstName} ${u.lastName}`).join(', ');
  }

  getAudienceColor(audience?: string): string {
    switch (audience) {
      case 'PUBLIC': return 'success';
      case 'WORSHIP_TEAM': return 'primary';
      case 'OUTREACH': return 'warning';
      default: return 'medium';
    }
  }

  getAudienceLabel(audience?: string): string {
    switch (audience) {
      case 'PUBLIC': return 'Public';
      case 'WORSHIP_TEAM': return 'Worship Team';
      case 'OUTREACH': return 'Outreach';
      default: return 'General';
    }
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
