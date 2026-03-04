import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonBadge, IonBackButton, IonButtons,
  IonFab, IonFabButton, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { PrayerRequestsService } from '../../services/prayer-requests.service';
import { PrayerRequest } from '../../interfaces/prayer-request.interface';

@Component({
  selector: 'app-prayer-requests-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonList, IonItem, IonLabel, IonBadge, IonBackButton, IonButtons,
    IonFab, IonFabButton, IonIcon,
  ],
  templateUrl: './prayer-requests-list.page.html',
  styleUrls: ['./prayer-requests-list.page.scss'],
})
export class PrayerRequestsListPage implements OnInit {
  prayerRequests: PrayerRequest[] = [];

  constructor(private prayerRequestsService: PrayerRequestsService) {
    addIcons({ addOutline });
  }

  ngOnInit() {
    this.loadPrayerRequests();
  }

  loadPrayerRequests() {
    this.prayerRequestsService.findAll().subscribe({
      next: (data) => this.prayerRequests = data,
    });
  }
}
