import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonIcon, IonButton, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { megaphoneOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { AnnouncementsService } from '../services/announcements.service';
import { Announcement } from '../interfaces/announcement.interface';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonList, IonItem, IonLabel, IonIcon, IonButton,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  announcements: Announcement[] = [];
  userName = '';
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private announcementsService: AnnouncementsService,
    private router: Router,
  ) {
    addIcons({ megaphoneOutline, logOutOutline });
  }

  ngOnInit() {
    const user = this.authService.currentUser;
    if (user) {
      this.userName = `${user.firstName} ${user.lastName}`;
      this.isAdmin = this.authService.hasRole('ADMIN') || this.authService.hasRole('SUPER_ADMIN');
    }
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  private loadData() {
    this.announcementsService.findAll().subscribe({
      next: (data) => this.announcements = data.slice(0, 5),
    });
  }
}
