import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonBadge, IonBackButton, IonButtons,
  IonSelect, IonSelectOption,
  ToastController,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonList, IonItem, IonLabel, IonBadge, IonBackButton, IonButtons,
    IonSelect, IonSelectOption,
  ],
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit {
  pendingUsers: User[] = [];
  allUsers: User[] = [];
  selectedRole: string = '';
  apiUrl = environment.apiUrl;

  availableRoles = [
    'NORMAL_USER', 'PASTOR', 'WORSHIP_LEADER', 'WORSHIP_TEAM_HEAD',
    'GUITARIST', 'KEYBOARDIST', 'DRUMMER', 'BASSIST', 'SINGER',
    'LEADER', 'OUTREACH_WORKER', 'ADMIN',
  ];

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.loadPendingUsers();
    this.loadAllUsers();
  }

  loadPendingUsers() {
    this.http.get<User[]>(`${this.apiUrl}/users/pending`).subscribe({
      next: (users) => this.pendingUsers = users,
    });
  }

  loadAllUsers() {
    this.http.get<User[]>(`${this.apiUrl}/users`).subscribe({
      next: (users) => this.allUsers = users,
    });
  }

  approveUser(userId: string) {
    this.http.patch<User>(`${this.apiUrl}/users/${userId}/approve`, {}).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: 'User approved', duration: 2000, color: 'success' });
        await toast.present();
        this.loadPendingUsers();
        this.loadAllUsers();
      },
    });
  }

  assignRole(userId: string, role: string) {
    if (!role) return;
    this.http.post<User>(`${this.apiUrl}/users/${userId}/roles`, { role }).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: `Role ${role} assigned`, duration: 2000, color: 'success' });
        await toast.present();
        this.loadAllUsers();
      },
    });
  }

  getRoleNames(user: User): string {
    return user.roles.map(r => r.name).join(', ');
  }
}
