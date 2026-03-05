import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonBadge, IonMenuButton, IonButtons,
  IonSelect, IonSelectOption, IonChip, IonSegment, IonSegmentButton,
  IonAvatar, IonIcon,
  ToastController, AlertController,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { logOutOutline, personAddOutline, trashOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user.interface';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { forkJoin } from 'rxjs';

interface ProfileChangeRequest {
  id: string;
  user: User;
  requestedChanges: Record<string, any>;
  status: string;
  createdAt: string;
}

interface PrayerRequest {
  id: string;
  title: string;
  content: string;
  author: User;
  status: string;
  createdAt: string;
}

interface Station {
  id: string;
  name: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonList, IonItem, IonLabel, IonBadge, IonMenuButton, IonButtons,
    IonSelect, IonSelectOption, IonChip, IonSegment, IonSegmentButton,
    IonAvatar, IonIcon,
  ],
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  activeTab = 'accounts';
  pendingUsers: User[] = [];
  allUsers: User[] = [];
  pendingProfileChanges: ProfileChangeRequest[] = [];
  pendingPrayerRequests: PrayerRequest[] = [];
  stations: Station[] = [];
  selectedRole: string = '';
  apiUrl = environment.apiUrl;

  availableRoles = [
    'NORMAL_USER', 'PASTOR', 'WORSHIP_LEADER', 'WORSHIP_TEAM_HEAD',
    'GUITARIST', 'KEYBOARDIST', 'DRUMMER', 'BASSIST', 'SINGER',
    'LEADER', 'OUTREACH_WORKER', 'ADMIN',
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
  ) {
    addIcons({ logOutOutline, personAddOutline, trashOutline });
  }

  ngOnInit() {
    this.loadAll();
  }

  ionViewWillEnter() {
    this.loadAll();
  }

  private loadAll() {
    this.loadPendingUsers();
    this.loadAllUsers();
    this.loadPendingProfileChanges();
    this.loadPendingPrayerRequests();
    this.loadStations();
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

  loadPendingProfileChanges() {
    this.profileService.getPendingProfileChanges().subscribe({
      next: (changes) => this.pendingProfileChanges = changes,
    });
  }

  loadPendingPrayerRequests() {
    this.http.get<PrayerRequest[]>(`${this.apiUrl}/prayer-requests/pending`).subscribe({
      next: (data) => this.pendingPrayerRequests = data,
    });
  }

  loadStations() {
    this.http.get<Station[]>(`${this.apiUrl}/youth-profiles/stations`).subscribe({
      next: (data) => this.stations = data,
    });
  }

  getInitials(user: User): string {
    return (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '');
  }

  async openApproveModal(user: User) {
    const alert = await this.alertCtrl.create({
      header: `Approve ${user.firstName} ${user.lastName}`,
      message: 'Select at least one role to assign:',
      inputs: this.availableRoles.map(role => ({
        type: 'checkbox' as const,
        label: role,
        value: role,
      })),
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Approve',
          handler: (selectedRoles: string[]) => {
            if (!selectedRoles || selectedRoles.length === 0) {
              return false;
            }
            this.approveWithRoles(user.id, selectedRoles);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private approveWithRoles(userId: string, roles: string[]) {
    const roleRequests = roles.map(role =>
      this.http.post<User>(`${this.apiUrl}/users/${userId}/roles`, { role })
    );

    forkJoin(roleRequests).subscribe({
      next: () => {
        this.http.patch<User>(`${this.apiUrl}/users/${userId}/approve`, {}).subscribe({
          next: async () => {
            const toast = await this.toastCtrl.create({
              message: `User approved with roles: ${roles.join(', ')}`,
              duration: 3000,
              color: 'success',
            });
            await toast.present();
            this.loadPendingUsers();
            this.loadAllUsers();
          },
        });
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Failed to assign roles',
          duration: 3000,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  assignRole(userId: string, role: string) {
    if (!role) return;
    this.http.post<User>(`${this.apiUrl}/users/${userId}/roles`, { role }).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: `Role ${role} assigned`, duration: 2000, color: 'success', position: 'top' });
        await toast.present();
        this.loadAllUsers();
      },
    });
  }

  async addUser() {
    const alert = await this.alertCtrl.create({
      header: 'Add User',
      inputs: [
        { name: 'email', type: 'email', placeholder: 'Email' },
        { name: 'password', type: 'password', placeholder: 'Password' },
        { name: 'firstName', type: 'text', placeholder: 'First Name' },
        { name: 'lastName', type: 'text', placeholder: 'Last Name' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add',
          handler: (data) => {
            if (!data.email || !data.password || !data.firstName || !data.lastName) return false;
            this.http.post(`${this.apiUrl}/users`, data).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({ message: 'User added', duration: 2000, color: 'success', position: 'top' });
                await toast.present();
                this.loadAllUsers();
              },
              error: async () => {
                const toast = await this.toastCtrl.create({ message: 'Failed to add user', duration: 3000, color: 'danger', position: 'top' });
                await toast.present();
              },
            });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async removeUser(user: User) {
    const alert = await this.alertCtrl.create({
      header: 'Remove User',
      message: `Are you sure you want to remove ${user.firstName} ${user.lastName}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.http.delete(`${this.apiUrl}/users/${user.id}`).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({ message: 'User removed', duration: 2000, color: 'success', position: 'top' });
                await toast.present();
                this.loadAllUsers();
              },
              error: async () => {
                const toast = await this.toastCtrl.create({ message: 'Failed to remove user', duration: 3000, color: 'danger', position: 'top' });
                await toast.present();
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  getRoleNames(user: User): string {
    return user.roles.map(r => r.name).join(', ');
  }

  getChangeFields(changes: Record<string, any>): { field: string; value: any }[] {
    return Object.entries(changes).map(([field, value]) => ({ field, value }));
  }

  approveProfileChange(id: string) {
    this.profileService.approveProfileChange(id).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: 'Profile change approved.', duration: 2000, color: 'success', position: 'top' });
        await toast.present();
        this.loadPendingProfileChanges();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: 'Failed to approve profile change.', duration: 3000, color: 'danger', position: 'top' });
        await toast.present();
      },
    });
  }

  rejectProfileChange(id: string) {
    this.profileService.rejectProfileChange(id).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: 'Profile change rejected.', duration: 2000, color: 'warning', position: 'top' });
        await toast.present();
        this.loadPendingProfileChanges();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: 'Failed to reject profile change.', duration: 3000, color: 'danger', position: 'top' });
        await toast.present();
      },
    });
  }

  approvePrayerRequest(id: string) {
    this.http.patch(`${this.apiUrl}/prayer-requests/${id}/approve`, {}).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: 'Prayer request approved.', duration: 2000, color: 'success', position: 'top' });
        await toast.present();
        this.loadPendingPrayerRequests();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: 'Failed to approve prayer request.', duration: 3000, color: 'danger', position: 'top' });
        await toast.present();
      },
    });
  }

  rejectPrayerRequest(id: string) {
    this.http.patch(`${this.apiUrl}/prayer-requests/${id}/reject`, {}).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: 'Prayer request rejected.', duration: 2000, color: 'warning', position: 'top' });
        await toast.present();
        this.loadPendingPrayerRequests();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({ message: 'Failed to reject prayer request.', duration: 3000, color: 'danger', position: 'top' });
        await toast.present();
      },
    });
  }

  async addStation() {
    const alert = await this.alertCtrl.create({
      header: 'Add Station',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Station Name' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add',
          handler: (data) => {
            if (!data.name) return false;
            this.http.post(`${this.apiUrl}/youth-profiles/stations`, { name: data.name }).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({ message: 'Station added', duration: 2000, color: 'success', position: 'top' });
                await toast.present();
                this.loadStations();
              },
              error: async () => {
                const toast = await this.toastCtrl.create({ message: 'Failed to add station', duration: 3000, color: 'danger', position: 'top' });
                await toast.present();
              },
            });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async removeStation(station: Station) {
    const alert = await this.alertCtrl.create({
      header: 'Remove Station',
      message: `Are you sure you want to remove "${station.name}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.http.delete(`${this.apiUrl}/youth-profiles/stations/${station.id}`).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({ message: 'Station removed', duration: 2000, color: 'success', position: 'top' });
                await toast.present();
                this.loadStations();
              },
              error: async () => {
                const toast = await this.toastCtrl.create({ message: 'Failed to remove station', duration: 3000, color: 'danger', position: 'top' });
                await toast.present();
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
