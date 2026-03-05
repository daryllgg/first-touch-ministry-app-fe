import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonIcon, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { megaphoneOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { AnnouncementsService } from '../services/announcements.service';
import { Announcement } from '../interfaces/announcement.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonList, IonItem, IonLabel, IonIcon,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, ViewWillEnter {
  announcements: Announcement[] = [];
  userName = '';
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private announcementsService: AnnouncementsService,
  ) {
    addIcons({ megaphoneOutline });
  }

  ngOnInit() {
    const user = this.authService.currentUser;
    if (user) {
      this.userName = `${user.firstName} ${user.lastName}`;
      this.isAdmin = this.authService.hasRole('ADMIN') || this.authService.hasRole('SUPER_ADMIN');
    }
  }

  ionViewWillEnter() {
    this.loadData();
  }

  private loadData() {
    this.announcementsService.findAll().subscribe({
      next: (data) => this.announcements = data.slice(0, 5),
    });
  }
}
