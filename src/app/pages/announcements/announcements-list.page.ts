import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonBackButton, IonButtons, IonFab, IonFabButton, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { AnnouncementsService } from '../../services/announcements.service';
import { AuthService } from '../../services/auth.service';
import { Announcement } from '../../interfaces/announcement.interface';

@Component({
  selector: 'app-announcements-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonList, IonItem, IonLabel, IonBackButton, IonButtons, IonFab, IonFabButton, IonIcon,
  ],
  templateUrl: './announcements-list.page.html',
  styleUrls: ['./announcements-list.page.scss'],
})
export class AnnouncementsListPage implements OnInit {
  announcements: Announcement[] = [];
  canCreate = false;

  constructor(
    private announcementsService: AnnouncementsService,
    private authService: AuthService,
  ) {
    addIcons({ addOutline });
  }

  ngOnInit() {
    this.canCreate = this.authService.hasRole('PASTOR') ||
      this.authService.hasRole('LEADER') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');

    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.announcementsService.findAll().subscribe({
      next: (data) => this.announcements = data,
    });
  }
}
