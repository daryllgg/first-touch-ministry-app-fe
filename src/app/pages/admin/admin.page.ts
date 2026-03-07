import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonBadge, IonMenuButton, IonButtons,
  IonSelect, IonSelectOption, IonChip, IonSegment, IonSegmentButton,
  IonAvatar, IonIcon, IonSkeletonText, IonSearchbar,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { logOutOutline, personAddOutline, trashOutline, chevronUpOutline, chevronDownOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user.interface';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { ToastService } from '../../components/toast/toast.service';
import { ModalService } from '../../components/modal/modal.service';
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
    IonAvatar, IonIcon, IonSkeletonText, IonSearchbar,
  ],
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  activeTab = 'accounts';
  accountsSubTab: 'all' | 'pending' | 'declined' = 'all';
  pendingUsers: User[] = [];
  allUsers: User[] = [];
  declinedUsers: User[] = [];
  pendingProfileChanges: ProfileChangeRequest[] = [];
  pendingPrayerRequests: PrayerRequest[] = [];
  stations: Station[] = [];
  selectedRole: string = '';
  apiUrl = environment.apiUrl;
  isLoading = true;
  private loadCount = 0;

  // Accordion
  expandedPendingIds = new Set<string>();

  // Search & filter
  userSearchQuery = '';
  userRoleFilter = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 50];

  availableRoles = [
    'NORMAL_USER', 'PASTOR', 'WORSHIP_LEADER', 'WORSHIP_TEAM_HEAD',
    'GUITARIST', 'KEYBOARDIST', 'DRUMMER', 'BASSIST', 'SINGER',
    'LEADER', 'OUTREACH_WORKER', 'ADMIN',
  ];

  getRolesForUser(user: any): string[] {
    const userRoleNames = (user.roles || []).map((r: any) => typeof r === 'string' ? r : r.name);
    return this.availableRoles.filter(role => !userRoleNames.includes(role));
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router,
    private toast: ToastService,
    private modal: ModalService,
  ) {
    addIcons({ logOutOutline, personAddOutline, trashOutline, chevronUpOutline, chevronDownOutline });
  }

  ngOnInit() {
    this.loadAll();
  }

  ionViewWillEnter() {
    this.loadAll();
  }

  private loadAll() {
    this.isLoading = true;
    this.loadCount = 6;
    this.loadPendingUsers();
    this.loadAllUsers();
    this.loadDeclinedUsers();
    this.loadPendingProfileChanges();
    this.loadPendingPrayerRequests();
    this.loadStations();
  }

  private checkLoaded() {
    if (--this.loadCount <= 0) this.isLoading = false;
  }

  loadPendingUsers() {
    this.http.get<User[]>(`${this.apiUrl}/users/pending`).subscribe({
      next: (users) => { this.pendingUsers = users; this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });
  }

  loadAllUsers() {
    this.http.get<User[]>(`${this.apiUrl}/users`).subscribe({
      next: (users) => { this.allUsers = users.filter(u => u.accountStatus === 'APPROVED'); this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });
  }

  loadDeclinedUsers() {
    this.http.get<User[]>(`${this.apiUrl}/users/declined`).subscribe({
      next: (users) => { this.declinedUsers = users; this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });
  }

  loadPendingProfileChanges() {
    this.profileService.getPendingProfileChanges().subscribe({
      next: (changes) => { this.pendingProfileChanges = changes; this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });
  }

  loadPendingPrayerRequests() {
    this.http.get<PrayerRequest[]>(`${this.apiUrl}/prayer-requests/pending`).subscribe({
      next: (data) => { this.pendingPrayerRequests = data; this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });
  }

  loadStations() {
    this.http.get<Station[]>(`${this.apiUrl}/youth-profiles/stations`).subscribe({
      next: (data) => { this.stations = data; this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });
  }

  get filteredUsers(): User[] {
    let users = this.allUsers;
    if (this.userSearchQuery) {
      const q = this.userSearchQuery.toLowerCase();
      users = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    if (this.userRoleFilter) {
      users = users.filter(u =>
        u.roles.some(r => r.name === this.userRoleFilter)
      );
    }
    return users;
  }

  get paginatedUsers(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  clearSearchFilter() {
    this.userSearchQuery = '';
    this.onFilterChange();
  }

  clearRoleFilter() {
    this.userRoleFilter = '';
    this.onFilterChange();
  }

  getInitials(user: User): string {
    return (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '');
  }

  togglePending(userId: string) {
    if (this.expandedPendingIds.has(userId)) {
      this.expandedPendingIds.delete(userId);
    } else {
      this.expandedPendingIds.add(userId);
    }
  }

  async openApproveModal(user: User) {
    const result = await this.modal.prompt({
      title: `Approve ${user.firstName} ${user.lastName}`,
      message: 'Select at least one role to assign:',
      inputs: this.availableRoles.map(role => ({
        key: role,
        label: role,
        type: 'checkbox' as const,
      })),
      confirmText: 'Approve',
    });
    if (result) {
      const selectedRoles = Object.entries(result)
        .filter(([, v]) => v === true)
        .map(([k]) => k);
      if (selectedRoles.length === 0) {
        this.toast.warning('Please select at least one role.');
        return;
      }
      this.approveWithRoles(user.id, selectedRoles);
    }
  }

  private approveWithRoles(userId: string, roles: string[]) {
    const roleRequests = roles.map(role =>
      this.http.post<User>(`${this.apiUrl}/users/${userId}/roles`, { role })
    );

    forkJoin(roleRequests).subscribe({
      next: () => {
        this.http.patch<User>(`${this.apiUrl}/users/${userId}/approve`, {}).subscribe({
          next: () => {
            this.toast.success(`User approved with roles: ${roles.join(', ')}`);
            this.loadPendingUsers();
            this.loadAllUsers();
            this.loadDeclinedUsers();
          },
        });
      },
      error: () => {
        this.toast.error('Failed to assign roles');
      },
    });
  }

  async openDeclineModal(user: User) {
    const result = await this.modal.prompt({
      title: `Decline ${user.firstName} ${user.lastName}`,
      inputs: [
        { key: 'reason', label: 'Reason for declining (optional)', type: 'textarea', placeholder: 'Enter reason (optional)' },
      ],
      confirmText: 'Decline',
    });
    if (result) {
      this.http.patch(`${this.apiUrl}/users/${user.id}/decline`, {
        reason: result['reason'] || undefined,
      }).subscribe({
        next: () => {
          this.toast.error(`${user.firstName} ${user.lastName} declined`);
          this.loadPendingUsers();
          this.loadDeclinedUsers();
        },
        error: () => {
          this.toast.error('Failed to decline user');
        },
      });
    }
  }

  async reApproveUser(user: User) {
    this.openApproveModal(user);
  }

  assignRole(userId: string, role: string) {
    if (!role) return;
    this.http.post<User>(`${this.apiUrl}/users/${userId}/roles`, { role }).subscribe({
      next: () => {
        this.toast.success(`Role ${role} assigned`);
        this.loadAllUsers();
      },
    });
  }

  async removeRole(userId: string, roleName: string) {
    const confirmed = await this.modal.confirm({
      title: 'Remove Role',
      message: `Remove the role "${roleName}" from this user?`,
      confirmText: 'Remove',
      confirmColor: 'danger',
    });
    if (confirmed) {
      this.http.delete(`${this.apiUrl}/users/${userId}/roles/${roleName}`).subscribe({
        next: () => {
          this.toast.success(`Role ${roleName} removed`);
          this.loadAllUsers();
        },
        error: () => {
          this.toast.error('Failed to remove role');
        },
      });
    }
  }

  async addUser() {
    const result = await this.modal.prompt({
      title: 'Add User',
      inputs: [
        { key: 'email', label: 'Email', type: 'email', placeholder: 'Email', required: true },
        { key: 'password', label: 'Password', type: 'password', placeholder: 'Password', required: true },
        { key: 'firstName', label: 'First Name', type: 'text', placeholder: 'First Name', required: true },
        { key: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Last Name', required: true },
      ],
      confirmText: 'Add',
    });
    if (result && result['email'] && result['password'] && result['firstName'] && result['lastName']) {
      this.http.post(`${this.apiUrl}/users`, result).subscribe({
        next: () => {
          this.toast.success('User added');
          this.loadAllUsers();
        },
        error: () => {
          this.toast.error('Failed to add user');
        },
      });
    }
  }

  async removeUser(user: User) {
    const confirmed = await this.modal.confirm({
      title: 'Remove User',
      message: `Are you sure you want to remove ${user.firstName} ${user.lastName}?`,
      confirmText: 'Remove',
      confirmColor: 'danger',
    });
    if (confirmed) {
      this.http.delete(`${this.apiUrl}/users/${user.id}`).subscribe({
        next: () => {
          this.toast.success('User removed');
          this.loadAllUsers();
        },
        error: () => {
          this.toast.error('Failed to remove user');
        },
      });
    }
  }

  getRoleNames(user: User): string {
    return user.roles.map(r => r.name).join(', ');
  }

  getChangeFields(changes: Record<string, any>): { field: string; value: any }[] {
    return Object.entries(changes).map(([field, value]) => ({ field, value }));
  }

  approveProfileChange(id: string) {
    this.profileService.approveProfileChange(id).subscribe({
      next: () => {
        this.toast.success('Profile change approved.');
        this.loadPendingProfileChanges();
      },
      error: () => {
        this.toast.error('Failed to approve profile change.');
      },
    });
  }

  rejectProfileChange(id: string) {
    this.profileService.rejectProfileChange(id).subscribe({
      next: () => {
        this.toast.warning('Profile change rejected.');
        this.loadPendingProfileChanges();
      },
      error: () => {
        this.toast.error('Failed to reject profile change.');
      },
    });
  }

  approvePrayerRequest(id: string) {
    this.http.patch(`${this.apiUrl}/prayer-requests/${id}/approve`, {}).subscribe({
      next: () => {
        this.toast.success('Prayer request approved.');
        this.loadPendingPrayerRequests();
      },
      error: () => {
        this.toast.error('Failed to approve prayer request.');
      },
    });
  }

  rejectPrayerRequest(id: string) {
    this.http.patch(`${this.apiUrl}/prayer-requests/${id}/reject`, {}).subscribe({
      next: () => {
        this.toast.warning('Prayer request rejected.');
        this.loadPendingPrayerRequests();
      },
      error: () => {
        this.toast.error('Failed to reject prayer request.');
      },
    });
  }

  async addStation() {
    const result = await this.modal.prompt({
      title: 'Add Station',
      inputs: [
        { key: 'name', label: 'Station Name', type: 'text', placeholder: 'Station Name', required: true },
      ],
      confirmText: 'Add',
    });
    if (result && result['name']) {
      this.http.post(`${this.apiUrl}/youth-profiles/stations`, { name: result['name'] }).subscribe({
        next: () => {
          this.toast.success('Station added');
          this.loadStations();
        },
        error: () => {
          this.toast.error('Failed to add station');
        },
      });
    }
  }

  async removeStation(station: Station) {
    const confirmed = await this.modal.confirm({
      title: 'Remove Station',
      message: `Are you sure you want to remove "${station.name}"?`,
      confirmText: 'Remove',
      confirmColor: 'danger',
    });
    if (confirmed) {
      this.http.delete(`${this.apiUrl}/youth-profiles/stations/${station.id}`).subscribe({
        next: () => {
          this.toast.success('Station removed');
          this.loadStations();
        },
        error: () => {
          this.toast.error('Failed to remove station');
        },
      });
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
