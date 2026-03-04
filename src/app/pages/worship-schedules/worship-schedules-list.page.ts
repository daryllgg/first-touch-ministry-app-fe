import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonBackButton, IonButtons,
} from '@ionic/angular/standalone';
import { WorshipSchedulesService } from '../../services/worship-schedules.service';
import { WorshipSchedule } from '../../interfaces/worship-schedule.interface';

@Component({
  selector: 'app-worship-schedules-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonBackButton, IonButtons,
  ],
  templateUrl: './worship-schedules-list.page.html',
  styleUrls: ['./worship-schedules-list.page.scss'],
})
export class WorshipSchedulesListPage implements OnInit {
  schedules: WorshipSchedule[] = [];

  constructor(private schedulesService: WorshipSchedulesService) {}

  ngOnInit() {
    this.schedulesService.findUpcoming().subscribe({
      next: (data) => this.schedules = data,
    });
  }
}
