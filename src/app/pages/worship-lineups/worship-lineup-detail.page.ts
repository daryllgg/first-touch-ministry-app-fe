import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonBackButton, IonButtons,
  IonBadge, IonIcon, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonNote, IonAvatar, IonRefresher, IonRefresherContent,
  IonSkeletonText, IonSpinner, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline, swapHorizontalOutline, alertCircleOutline, createOutline, refreshOutline, trashOutline, linkOutline, timeOutline } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { WorshipLineupsService } from '../../services/worship-lineups.service';
import { AuthService } from '../../services/auth.service';
import { WorshipLineup, SubstitutionRequest } from '../../interfaces/worship-lineup.interface';
import { User } from '../../interfaces/user.interface';
import { ToastService } from '../../components/toast/toast.service';
import { ModalService } from '../../components/modal/modal.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-worship-lineup-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonList, IonItem, IonLabel, IonBackButton, IonButtons,
    IonBadge, IonIcon, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonNote, IonAvatar, IonRefresher, IonRefresherContent,
    IonSkeletonText, IonSpinner,
  ],
  templateUrl: './worship-lineup-detail.page.html',
  styleUrls: ['./worship-lineup-detail.page.scss'],
})
export class WorshipLineupDetailPage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  lineup: WorshipLineup | null = null;
  substitutionRequests: SubstitutionRequest[] = [];
  canReview = false;
  canRequestSubstitution = false;
  currentUserId: string | null = null;
  apiUrl = environment.apiUrl;
  isLoading = true;
  loadError = false;

  // Activity / Comments
  activityItems: any[] = [];
  commentText = '';
  isSubmittingComment = false;
  canComment = false;
  allUsers: User[] = [];
  mentionUsers: User[] = [];
  showMentionDropdown = false;
  mentionedUserIds: string[] = [];
  mentionSearchText = '';

  private lineupId: string | null = null;
  private loadCount = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lineupsService: WorshipLineupsService,
    private authService: AuthService,
    private http: HttpClient,
    private toast: ToastService,
    private modal: ModalService,
  ) {
    addIcons({ checkmarkOutline, closeOutline, swapHorizontalOutline, alertCircleOutline, createOutline, refreshOutline, trashOutline, linkOutline, timeOutline });
  }

  ngOnInit() {
    this.canReview = this.authService.hasRole('WORSHIP_TEAM_HEAD') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');

    this.currentUserId = this.authService.currentUser?.id ?? null;
    this.lineupId = this.route.snapshot.paramMap.get('id');
    this.loadAll();
  }

  ionViewWillEnter() {
    this.loadAll();
  }

  private loadAll() {
    if (this.lineupId) {
      this.isLoading = true;
      this.loadError = false;
      this.loadCount = 2;
      this.loadLineup(this.lineupId);
      this.loadSubstitutionRequests(this.lineupId);
    }
  }

  private checkLoaded() {
    if (--this.loadCount <= 0) this.isLoading = false;
  }

  loadLineup(id: string) {
    this.lineupsService.findOne(id).subscribe({
      next: async (data) => {
        const isMember = data.members.some(
          (m) => m.user.id === this.currentUserId
        );
        const isSubmitter = data.submittedBy?.id === this.currentUserId;

        if (!isSubmitter && !isMember && !this.canReview) {
          await this.modal.alert({
            title: 'Access Notice',
            message: 'You are no longer part of this lineup.',
          });
          this.router.navigate(['/worship-lineups']);
          return;
        }

        this.lineup = data;
        this.canRequestSubstitution = isMember;
        this.buildActivityTimeline();
        this.updateCanComment();
        this.buildMentionUsers();
        this.checkLoaded();
      },
      error: () => { this.loadError = true; this.checkLoaded(); },
    });
  }

  loadSubstitutionRequests(id: string) {
    this.lineupsService.findSubstitutionRequests(id).subscribe({
      next: (data) => { this.substitutionRequests = data; this.checkLoaded(); },
      error: () => this.checkLoaded(),
    });
  }

  formatServiceType(type: string): string {
    switch (type) {
      case 'SUNDAY_SERVICE': return 'Sunday Service';
      case 'PLUG_IN_WORSHIP': return 'Plug In Worship';
      case 'YOUTH_SERVICE': return 'Youth Service';
      case 'SPECIAL_EVENT': return 'Special Event';
      default: return type;
    }
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  get isSubmitter(): boolean {
    return this.lineup?.submittedBy?.id === this.currentUserId;
  }

  get sortedReviews() {
    if (!this.lineup?.reviews) return [];
    return [...this.lineup.reviews].reverse();
  }

  buildActivityTimeline() {
    if (!this.lineup) { this.activityItems = []; return; }
    const items: any[] = [];

    // Add reviews
    for (const r of (this.lineup.reviews || [])) {
      items.push({
        type: 'review',
        id: r.id,
        user: r.reviewer,
        status: r.status,
        comment: r.comment,
        createdAt: r.createdAt,
      });
    }

    // Add comments
    for (const c of (this.lineup.comments || [])) {
      items.push({
        type: 'comment',
        id: c.id,
        user: c.author,
        content: c.content,
        mentionedUsers: c.mentionedUsers,
        createdAt: c.createdAt,
      });
    }

    // Sort chronologically (latest first)
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    this.activityItems = items;
  }

  updateCanComment() {
    if (!this.lineup) { this.canComment = false; return; }
    const isInvolved = this.lineup.submittedBy?.id === this.currentUserId ||
      this.lineup.members?.some((m) => m.user.id === this.currentUserId);
    const isPrivileged = this.authService.hasRole('PASTOR') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');
    this.canComment = isInvolved || isPrivileged;
  }

  buildMentionUsers() {
    if (!this.lineup) return;
    // Start with involved users: submitter + members
    const userMap = new Map<string, User>();
    const sub = this.lineup.submittedBy;
    if (sub) userMap.set(sub.id, sub);
    for (const m of this.lineup.members || []) {
      userMap.set(m.user.id, m.user);
    }

    // Also fetch worship leaders + worship team heads
    this.http.get<User[]>(`${this.apiUrl}/users/by-roles`, {
      params: { roles: 'WORSHIP_LEADER,WORSHIP_TEAM_HEAD' },
    }).subscribe({
      next: (users) => {
        for (const u of users) {
          userMap.set(u.id, u);
        }
        this.allUsers = Array.from(userMap.values());
      },
      error: () => {
        // Fall back to just involved users
        this.allUsers = Array.from(userMap.values());
      },
    });
  }

  onCommentInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex >= 0) {
      const afterAt = textBeforeCursor.substring(atIndex + 1);
      if (!afterAt.includes(' ') || afterAt.split(' ').length <= 2) {
        this.mentionSearchText = afterAt.toLowerCase();
        this.mentionUsers = this.allUsers.filter((u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(this.mentionSearchText) &&
          !this.mentionedUserIds.includes(u.id)
        ).slice(0, 5);
        this.showMentionDropdown = this.mentionUsers.length > 0;
        return;
      }
    }
    this.showMentionDropdown = false;
  }

  selectMention(user: User, textarea: HTMLTextAreaElement) {
    const value = textarea.value;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const fullName = `${user.firstName} ${user.lastName}`;

    const before = value.substring(0, atIndex);
    const after = value.substring(cursorPos);
    this.commentText = `${before}@${fullName} ${after}`;
    this.mentionedUserIds.push(user.id);
    this.showMentionDropdown = false;

    setTimeout(() => {
      const newPos = before.length + fullName.length + 2;
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    });
  }

  submitComment(textarea?: HTMLTextAreaElement) {
    if (!this.commentText.trim() || !this.lineup) return;
    this.isSubmittingComment = true;
    this.lineupsService.addComment(
      this.lineup.id,
      this.commentText.trim(),
      this.mentionedUserIds.length > 0 ? this.mentionedUserIds : undefined,
    ).subscribe({
      next: () => {
        this.commentText = '';
        this.mentionedUserIds = [];
        this.isSubmittingComment = false;
        if (this.lineupId) this.loadLineup(this.lineupId);
      },
      error: () => {
        this.isSubmittingComment = false;
        this.toast.error('Failed to post comment');
      },
    });
  }

  deleteComment(commentId: string) {
    if (!this.lineup) return;
    this.lineupsService.deleteComment(this.lineup.id, commentId).subscribe({
      next: () => {
        if (this.lineupId) this.loadLineup(this.lineupId);
      },
      error: () => this.toast.error('Failed to delete comment'),
    });
  }

  getStatusDotClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'dot-approved';
      case 'REJECTED': return 'dot-rejected';
      case 'CHANGES_REQUESTED': return 'dot-changes';
      default: return 'dot-pending';
    }
  }

  formatStatus(status: string): string {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Declined';
      case 'CHANGES_REQUESTED': return 'Changes Requested';
      default: return status;
    }
  }

  async approve() {
    if (!this.lineup) return;
    const result = await this.modal.prompt({
      title: 'Approve Lineup',
      inputs: [
        { key: 'comment', label: 'Add a note (optional)', type: 'textarea', placeholder: 'Add a note (optional)' },
      ],
      confirmText: 'Approve',
    });
    if (result) {
      this.lineupsService.updateStatus(this.lineup.id, 'APPROVED', result['comment'] || undefined).subscribe({
        next: (updated) => {
          this.lineup = updated;
          this.toast.success('Lineup approved');
        },
      });
    }
  }

  async reject() {
    if (!this.lineup) return;
    const result = await this.modal.prompt({
      title: 'Decline Lineup',
      inputs: [
        { key: 'comment', label: 'Reason for declining (optional)', type: 'textarea', placeholder: 'Reason for declining (optional)' },
      ],
      confirmText: 'Decline',
    });
    if (result) {
      this.lineupsService.updateStatus(this.lineup.id, 'REJECTED', result['comment'] || undefined).subscribe({
        next: (updated) => {
          this.lineup = updated;
          this.toast.error('Lineup declined');
        },
      });
    }
  }

  resubmit() {
    if (!this.lineup) return;
    this.lineupsService.resubmit(this.lineup.id).subscribe({
      next: (data) => {
        this.lineup = data;
        this.toast.success('Lineup resubmitted');
      },
    });
  }

  async deleteLineup() {
    if (!this.lineup) return;
    const confirmed = await this.modal.confirm({
      title: 'Delete Lineup',
      message: 'Are you sure you want to delete this lineup? This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: 'danger',
    });
    if (confirmed) {
      this.lineupsService.delete(this.lineup.id).subscribe({
        next: () => {
          this.toast.success('Lineup deleted');
          this.router.navigate(['/worship-lineups']);
        },
        error: () => {
          this.toast.error('Failed to delete lineup');
        },
      });
    }
  }

  async requestChanges() {
    if (!this.lineup) return;
    const result = await this.modal.prompt({
      title: 'Request Changes',
      message: 'Please describe the changes needed:',
      inputs: [
        { key: 'comment', label: 'Changes needed', type: 'textarea', placeholder: 'What changes are needed?', required: true },
      ],
      confirmText: 'Submit',
    });
    if (result && result['comment']) {
      this.lineupsService.requestChanges(this.lineup.id, result['comment']).subscribe({
        next: (updated) => {
          this.lineup = updated;
          this.toast.warning('Changes requested');
        },
      });
    }
  }

  async requestSubstitution(memberId: string) {
    const result = await this.modal.prompt({
      title: 'Request Substitution',
      inputs: [
        { key: 'reason', label: 'Reason for substitution', type: 'textarea', placeholder: 'Reason for substitution', required: true },
      ],
      confirmText: 'Submit',
    });
    if (result && result['reason']) {
      this.lineupsService.createSubstitutionRequest({
        lineupMemberId: memberId,
        reason: result['reason'],
      }).subscribe({
        next: () => {
          this.toast.success('Substitution request submitted');
          if (this.lineup) this.loadSubstitutionRequests(this.lineup.id);
        },
      });
    }
  }

  approveSubstitution(requestId: string) {
    this.lineupsService.updateSubstitutionStatus(requestId, 'APPROVED').subscribe({
      next: () => {
        this.toast.success('Substitution approved');
        if (this.lineup) this.loadSubstitutionRequests(this.lineup.id);
      },
    });
  }

  rejectSubstitution(requestId: string) {
    this.lineupsService.updateSubstitutionStatus(requestId, 'REJECTED').subscribe({
      next: () => {
        this.toast.error('Substitution rejected');
        if (this.lineup) this.loadSubstitutionRequests(this.lineup.id);
      },
    });
  }

  acceptSubstitution(requestId: string) {
    this.lineupsService.acceptSubstitution(requestId).subscribe({
      next: () => {
        this.toast.success('Substitution accepted');
        if (this.lineup) this.loadSubstitutionRequests(this.lineup.id);
      },
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'CHANGES_REQUESTED': return 'warning';
      case 'ACCEPTED': return 'tertiary';
      default: return 'medium';
    }
  }

  handleRefresh(event: any) {
    if (this.lineupId) {
      this.loadLineup(this.lineupId);
      this.loadSubstitutionRequests(this.lineupId);
    }
    setTimeout(() => event.target.complete(), 1000);
  }

  isMyMember(memberId: string): boolean {
    if (!this.lineup) return false;
    const member = this.lineup.members.find((m) => m.id === memberId);
    return member?.user.id === this.currentUserId;
  }
}
