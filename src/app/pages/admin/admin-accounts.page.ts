import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
  IonList, IonItem, IonLabel, IonAvatar, IonIcon, IonSkeletonText,
  IonSearchbar, IonSelect, IonSelectOption, IonBackButton, IonSegment, IonSegmentButton,
  ViewWillEnter, IonRefresher, IonRefresherContent,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { personAddOutline, trashOutline, chevronUpOutline, chevronDownOutline, chevronForwardOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user.interface';
import { ToastService } from '../../components/toast/toast.service';
import { ModalService } from '../../components/modal/modal.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-accounts',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
    IonList, IonItem, IonLabel, IonAvatar, IonIcon, IonSkeletonText,
    IonSearchbar, IonSelect, IonSelectOption, IonBackButton, IonSegment, IonSegmentButton,
    IonRefresher, IonRefresherContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/admin"></ion-back-button>
        </ion-buttons>
        <ion-title>Accounts</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="accountsSubTab" class="pill-segment pill-segment-sub">
          <ion-segment-button value="all">All Users</ion-segment-button>
          <ion-segment-button value="pending">Pending ({{ pendingUsers.length }})</ion-segment-button>
          <ion-segment-button value="declined">Declined ({{ declinedUsers.length }})</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="admin-content">
        @if (isLoading) {
          <ion-list>
            @for (i of [1,2,3,4]; track i) {
              <ion-item>
                <ion-avatar slot="start">
                  <ion-skeleton-text [animated]="true" style="width:100%;height:100%"></ion-skeleton-text>
                </ion-avatar>
                <ion-label>
                  <ion-skeleton-text [animated]="true" style="width:50%;height:16px"></ion-skeleton-text>
                  <ion-skeleton-text [animated]="true" style="width:70%;height:12px;margin-top:6px"></ion-skeleton-text>
                </ion-label>
              </ion-item>
            }
          </ion-list>
        } @else {

        <!-- ALL USERS -->
        @if (accountsSubTab === 'all') {
          <div class="sub-section-header">
            <h2>All Users</h2>
            <ion-button size="small" (click)="addUser()">
              <ion-icon name="person-add-outline" slot="start"></ion-icon>
              Add User
            </ion-button>
          </div>
          <ion-searchbar [(ngModel)]="userSearchQuery" (ionInput)="onFilterChange()" placeholder="Search by name or email..." debounce="300" class="search-bar"></ion-searchbar>
          <ion-select [(ngModel)]="userRoleFilter" (ionChange)="onFilterChange()" placeholder="Filter by role" interface="popover" class="role-filter">
            <ion-select-option value="">All Roles</ion-select-option>
            @for (role of availableRoles; track role) {
              <ion-select-option [value]="role">{{ role }}</ion-select-option>
            }
          </ion-select>

          @if (userSearchQuery || userRoleFilter) {
            <div class="active-filters">
              @if (userSearchQuery) {
                <span class="filter-chip">
                  Search: "{{ userSearchQuery }}"
                  <span class="filter-chip-remove" (click)="clearSearchFilter()">&times;</span>
                </span>
              }
              @if (userRoleFilter) {
                <span class="filter-chip">
                  Role: {{ userRoleFilter }}
                  <span class="filter-chip-remove" (click)="clearRoleFilter()">&times;</span>
                </span>
              }
            </div>
          }

          @for (user of paginatedUsers; track user.id) {
            <div class="user-card">
              <div class="user-card-top">
                <div class="user-avatar">
                  @if (user.profilePicture) {
                    <img [src]="apiUrl + '/uploads/' + user.profilePicture" alt="" />
                  } @else {
                    <div class="avatar-initials">{{ getInitials(user) }}</div>
                  }
                </div>
                <div class="user-info">
                  <div class="user-name">{{ user.firstName }} {{ user.lastName }}</div>
                  <div class="user-email">{{ user.email }}</div>
                </div>
              </div>
              <div class="user-roles">
                @for (role of user.roles; track role.id) {
                  <span class="role-badge">
                    {{ role.name }}
                    @if (user.roles.length > 1) {
                      <span class="role-remove" (click)="removeRole(user.id, role.name); $event.stopPropagation()">&times;</span>
                    }
                  </span>
                }
              </div>
              <div class="user-card-actions">
                <ion-select placeholder="Add Role" interface="popover" class="add-role-select"
                  (ionChange)="assignRole(user.id, $event.detail.value)">
                  @for (role of getRolesForUser(user); track role) {
                    <ion-select-option [value]="role">{{ role }}</ion-select-option>
                  }
                </ion-select>
                <ion-button fill="clear" color="danger" size="small" (click)="removeUser(user)">
                  <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                </ion-button>
              </div>
            </div>
          }

          @if (filteredUsers.length === 0 && allUsers.length > 0) {
            <div class="empty-state">
              <p>No users match your search.</p>
            </div>
          }

          @if (filteredUsers.length > pageSize) {
            <div class="pagination-mobile">
              <ion-button size="small" fill="outline" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">Prev</ion-button>
              <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
              <ion-button size="small" fill="outline" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">Next</ion-button>
            </div>
          }
        }

        <!-- PENDING APPROVALS -->
        @if (accountsSubTab === 'pending') {
          @if (pendingUsers.length === 0) {
            <div class="empty-state">
              <ion-icon name="person-add-outline" style="font-size:48px;color:#94a3b8;margin-bottom:8px"></ion-icon>
              <p>No pending approvals.</p>
            </div>
          } @else {
            @for (user of pendingUsers; track user.id) {
              <div class="user-card pending-card">
                <div class="pending-header" (click)="togglePending(user.id)">
                  <div class="user-avatar">
                    @if (user.profilePicture) {
                      <img [src]="apiUrl + '/uploads/' + user.profilePicture" alt="" />
                    } @else {
                      <div class="avatar-initials">{{ getInitials(user) }}</div>
                    }
                  </div>
                  <div class="user-info" style="flex:1">
                    <div class="user-name">{{ user.firstName }} {{ user.middleName || '' }} {{ user.lastName }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                  <ion-icon [name]="expandedPendingIds.has(user.id) ? 'chevron-up-outline' : 'chevron-down-outline'" class="toggle-icon"></ion-icon>
                </div>
                @if (expandedPendingIds.has(user.id)) {
                  <div class="pending-details">
                    <div class="detail-row">
                      <span class="detail-label">Contact</span>
                      <span class="detail-value">{{ user.contactNumber || '—' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Birthday</span>
                      <span class="detail-value">{{ user.birthday || '—' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Gender</span>
                      <span class="detail-value">{{ user.gender || '—' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Address</span>
                      <span class="detail-value">{{ user.address || '—' }}</span>
                    </div>
                    @if (user.facebookLink) {
                      <div class="detail-row">
                        <span class="detail-label">Facebook</span>
                        <span class="detail-value">{{ user.facebookLink }}</span>
                      </div>
                    }
                    @if (user.invitedBy) {
                      <div class="detail-row">
                        <span class="detail-label">Invited By</span>
                        <span class="detail-value">{{ user.invitedBy }}</span>
                      </div>
                    }
                    @if (user.firstDateAttendedChurch) {
                      <div class="detail-row">
                        <span class="detail-label">First Attended</span>
                        <span class="detail-value">{{ user.firstDateAttendedChurch }}</span>
                      </div>
                    }
                    @if (user.dateBaptized) {
                      <div class="detail-row">
                        <span class="detail-label">Date Baptized</span>
                        <span class="detail-value">{{ user.dateBaptized }}</span>
                      </div>
                    }
                  </div>
                }
                <div class="pending-actions">
                  <ion-button size="small" color="success" (click)="openApproveModal(user); $event.stopPropagation()">Approve</ion-button>
                  <ion-button size="small" color="danger" fill="outline" (click)="openDeclineModal(user); $event.stopPropagation()">Decline</ion-button>
                </div>
              </div>
            }
          }
        }

        <!-- DECLINED -->
        @if (accountsSubTab === 'declined') {
          @if (declinedUsers.length === 0) {
            <div class="empty-state">
              <ion-icon name="close-circle-outline" style="font-size:48px;color:#94a3b8;margin-bottom:8px"></ion-icon>
              <p>No declined accounts.</p>
            </div>
          } @else {
            @for (user of declinedUsers; track user.id) {
              <div class="user-card">
                <div class="user-card-top">
                  <div class="user-avatar">
                    @if (user.profilePicture) {
                      <img [src]="apiUrl + '/uploads/' + user.profilePicture" alt="" />
                    } @else {
                      <div class="avatar-initials">{{ getInitials(user) }}</div>
                    }
                  </div>
                  <div class="user-info">
                    <div class="user-name">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="user-email">{{ user.email }}</div>
                    @if (user.declineReason) {
                      <div class="decline-reason">Reason: {{ user.declineReason }}</div>
                    }
                  </div>
                </div>
                <div class="user-card-actions" style="justify-content:flex-end">
                  <ion-button color="success" size="small" (click)="reApproveUser(user)">Re-approve</ion-button>
                </div>
              </div>
            }
          }
        }

        }
      </div>
    </ion-content>
  `,
  styles: [`
    .admin-content {
      padding: 16px;
    }

    ion-item {
      --background: white;
      border-radius: 12px;
      margin-bottom: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
      --padding-top: 12px;
      --padding-bottom: 12px;
    }

    .sub-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0 0 12px;

      h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #1a3a4a;
      }
    }

    .search-bar {
      --background: white;
      margin-bottom: 8px;
      --border-radius: 12px;
    }

    .role-filter {
      margin-bottom: 12px;
      max-width: 100%;
    }

    .active-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 16px;
      font-size: 0.78rem;
      font-weight: 500;
      background: #e8f1f5;
      color: #1a3a4a;
      white-space: nowrap;
    }

    .filter-chip-remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      font-size: 1rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      line-height: 1;
    }

    .filter-chip-remove:active {
      background: rgba(0, 0, 0, 0.08);
    }

    /* ═══ User Cards ═══ */

    .user-card {
      background: white;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    }

    .user-card-top {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }

    .user-avatar {
      flex-shrink: 0;

      img {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    .avatar-initials {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #1a3a4a;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
    }

    .user-info {
      min-width: 0;
    }

    .user-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.3;
    }

    .user-email {
      font-size: 0.82rem;
      color: #64748b;
      margin-top: 2px;
      word-break: break-all;
    }

    .decline-reason {
      font-size: 0.8rem;
      color: #ef4444;
      margin-top: 4px;
      font-style: italic;
    }

    /* ═══ Role Badges ═══ */

    .user-roles {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.72rem;
      font-weight: 600;
      background: #e2e8f0;
      color: #475569;
      white-space: nowrap;
      line-height: 1.4;
    }

    .role-remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      margin-left: 2px;
      border-radius: 50%;
      font-size: 0.9rem;
      font-weight: 700;
      color: #94a3b8;
      cursor: pointer;
    }

    /* ═══ Card Actions ═══ */

    .user-card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid #f1f5f9;
    }

    .add-role-select {
      flex: 1;
      max-width: 200px;
      font-size: 0.85rem;
    }

    /* ═══ Pending Cards ═══ */

    .pending-card {
      overflow: hidden;
    }

    .pending-header {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding-bottom: 12px;
    }

    .toggle-icon {
      color: #94a3b8;
      font-size: 20px;
      flex-shrink: 0;
    }

    .pending-details {
      background: #f8fafc;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 12px;
    }

    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 6px 0;
      border-bottom: 1px solid #e2e8f0;

      &:last-child {
        border-bottom: none;
      }
    }

    .detail-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .detail-value {
      font-size: 0.88rem;
      color: #1e293b;
    }

    .pending-actions {
      display: flex;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid #f1f5f9;
    }

    /* ═══ Pagination ═══ */

    .pagination-mobile {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin: 12px 0;
    }

    .page-info {
      font-size: 0.85rem;
      color: #64748b;
    }

    /* ═══ Empty State ═══ */

    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: #94a3b8;

      p {
        font-size: 0.9rem;
        margin: 0;
      }
    }

    /* ═══ Pill Segments ═══ */

    .pill-segment {
      background: #f1f5f9;
      border-radius: 24px;
      padding: 4px;

      &::part(indicator) {
        display: none;
      }

      ion-segment-button {
        --background: transparent;
        --background-checked: #1a3a4a;
        --color: #64748b;
        --color-checked: #ffffff;
        --border-radius: 20px;
        --padding-start: 14px;
        --padding-end: 14px;
        --padding-top: 6px;
        --padding-bottom: 6px;
        --indicator-height: 0;
        --indicator-color: transparent;
        --border-width: 0;
        min-width: auto;
        min-height: 32px;
        font-size: 0.78rem;
        font-weight: 500;
        text-transform: none;
        letter-spacing: 0;

        &::part(indicator) {
          display: none;
        }

        &::part(indicator-background) {
          display: none;
        }

        &::part(native) {
          padding: 6px 14px;
        }
      }
    }

    .pill-segment-sub {
      margin: 0;
      border-radius: 20px;
    }
  `],
})
export class AdminAccountsPage implements OnInit, ViewWillEnter {
  apiUrl = environment.apiUrl;
  isLoading = true;
  accountsSubTab: 'all' | 'pending' | 'declined' = 'all';

  allUsers: User[] = [];
  pendingUsers: User[] = [];
  declinedUsers: User[] = [];

  expandedPendingIds = new Set<string>();

  userSearchQuery = '';
  userRoleFilter = '';
  currentPage = 1;
  pageSize = 10;

  availableRoles = [
    'NORMAL_USER', 'PASTOR', 'WORSHIP_LEADER', 'WORSHIP_TEAM_HEAD',
    'GUITARIST', 'KEYBOARDIST', 'DRUMMER', 'BASSIST', 'SINGER',
    'LEADER', 'OUTREACH_WORKER', 'ADMIN',
  ];

  private loadCount = 0;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toast: ToastService,
    private modal: ModalService,
  ) {
    addIcons({ personAddOutline, trashOutline, chevronUpOutline, chevronDownOutline, chevronForwardOutline });
  }

  ngOnInit() {
    this.loadAll();
  }

  ionViewWillEnter() {
    this.loadAll();
  }

  doRefresh(event: any) {
    this.loadAll();
    setTimeout(() => event.target.complete(), 1000);
  }

  private loadAll() {
    this.isLoading = true;
    this.loadCount = 3;
    this.loadAllUsers();
    this.loadPendingUsers();
    this.loadDeclinedUsers();
  }

  private checkLoaded() {
    if (--this.loadCount <= 0) this.isLoading = false;
  }

  loadAllUsers() {
    this.http.get<User[]>(`${this.apiUrl}/users`).subscribe({
      next: (users) => { this.allUsers = users.filter(u => u.accountStatus === 'APPROVED'); this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });
  }

  loadPendingUsers() {
    this.http.get<User[]>(`${this.apiUrl}/users/pending`).subscribe({
      next: (users) => { this.pendingUsers = users; this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });
  }

  loadDeclinedUsers() {
    this.http.get<User[]>(`${this.apiUrl}/users/declined`).subscribe({
      next: (users) => { this.declinedUsers = users; this.checkLoaded(); },
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

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
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

  getRolesForUser(user: any): string[] {
    const userRoleNames = (user.roles || []).map((r: any) => typeof r === 'string' ? r : r.name);
    return this.availableRoles.filter(role => !userRoleNames.includes(role));
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
}
