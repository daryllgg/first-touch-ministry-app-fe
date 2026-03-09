import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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

  justSubmittedPlaylist: string | null = null;
  private lineupId: string | null = null;
  private loadCount = 0;
  private isInitialLoad = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lineupsService: WorshipLineupsService,
    private authService: AuthService,
    private http: HttpClient,
    private toast: ToastService,
    private modal: ModalService,
    private sanitizer: DomSanitizer,
  ) {
    addIcons({ checkmarkOutline, closeOutline, swapHorizontalOutline, alertCircleOutline, createOutline, refreshOutline, trashOutline, linkOutline, timeOutline });
  }

  ngOnInit() {
    this.canReview = this.authService.hasRole('WORSHIP_TEAM_HEAD') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');

    this.currentUserId = this.authService.currentUser?.id ?? null;
    this.lineupId = this.route.snapshot.paramMap.get('id');

    const navState = this.router.getCurrentNavigation()?.extras?.state as { playlistUrl?: string; isNewSubmit?: boolean } | undefined;
    if (navState?.isNewSubmit && navState?.playlistUrl) {
      this.justSubmittedPlaylist = navState.playlistUrl;
    }

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
      this.isInitialLoad = true;
      this.loadLineup(this.lineupId);
      this.loadSubstitutionRequests(this.lineupId);
    }
  }

  private checkLoaded() {
    if (--this.loadCount <= 0) {
      if (this.isInitialLoad) {
        this.checkAccess();
        this.isInitialLoad = false;
      }
      this.isLoading = false;
    }
  }

  private checkAccess() {
    if (!this.lineup) return;
    const isMember = this.lineup.members.some(m => m.user.id === this.currentUserId);
    const isSubmitter = this.lineup.submittedBy?.id === this.currentUserId;
    const isMentioned = this.lineup.comments?.some(c =>
      (c as any).mentionedUsers?.some((mu: any) => mu.id === this.currentUserId)
    );
    const isSubstitute = this.substitutionRequests.some(s => s.substituteUser?.id === this.currentUserId);
    this.canRequestSubstitution = isMember;
    if (!isSubmitter && !isMember && !this.canReview && !isMentioned && !isSubstitute) {
      this.modal.alert({
        title: 'Access Notice',
        message: 'You are no longer part of this lineup.',
      }).then(() => this.router.navigate(['/worship-lineups']));
    }
  }

  loadLineup(id: string) {
    this.lineupsService.findOne(id).subscribe({
      next: (data) => {
        this.lineup = data;
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
      next: (data) => { this.substitutionRequests = data; this.buildActivityTimeline(); this.updateCanComment(); this.checkLoaded(); },
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

    // Add completed substitution requests (ACCEPTED only)
    for (const s of this.substitutionRequests) {
      if (s.status === 'ACCEPTED' && s.substituteUser) {
        items.push({
          type: 'substitution',
          id: 'sub-' + s.id,
          user: s.substituteUser,
          originalUser: s.requestedBy,
          instrumentRole: s.lineupMember?.instrumentRole?.name,
          createdAt: s.respondedAt || s.updatedAt,
        });
      }
    }

    // Sort chronologically (latest first)
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    this.activityItems = items;
  }

  updateCanComment() {
    if (!this.lineup) { this.canComment = false; return; }
    const isInvolved = this.lineup.submittedBy?.id === this.currentUserId ||
      this.lineup.members?.some((m) => m.user.id === this.currentUserId);
    const isSubstitute = this.substitutionRequests.some(
      (s) => s.status === 'ACCEPTED' && s.substituteUser?.id === this.currentUserId,
    );
    const isPrivileged = this.authService.hasRole('PASTOR') ||
      this.authService.hasRole('WORSHIP_LEADER') ||
      this.authService.hasRole('WORSHIP_TEAM_HEAD') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');
    this.canComment = isInvolved || isSubstitute || isPrivileged;
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

  async deleteComment(commentId: string) {
    if (!this.lineup) return;
    const confirmed = await this.modal.confirm({
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete',
      confirmColor: 'danger',
    });
    if (!confirmed) return;
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

  private instrumentRoleToUserRole(instrumentRoleName: string): string {
    const name = instrumentRoleName.toLowerCase();
    if (name.includes('singer')) return 'SINGER';
    if (name.includes('drum')) return 'DRUMMER';
    if (name.includes('bass')) return 'BASSIST';
    if (name.includes('guitar')) return 'GUITARIST';
    if (name.includes('keyboard') || name.includes('piano')) return 'KEYBOARDIST';
    return 'SINGER,GUITARIST,KEYBOARDIST,DRUMMER,BASSIST';
  }

  async requestSubstitution(memberId: string) {
    const member = this.lineup?.members.find(m => m.id === memberId);
    const roleToFetch = member
      ? this.instrumentRoleToUserRole(member.instrumentRole.name)
      : 'SINGER,GUITARIST,KEYBOARDIST,DRUMMER,BASSIST';

    const users = await this.http.get<User[]>(
      `${environment.apiUrl}/users/by-roles?roles=${roleToFetch}`
    ).toPromise().catch(() => [] as User[]);

    const userOptions = [
      { value: '', label: '— Select a person —' },
      ...(users || []).filter(u => u.id !== this.currentUserId).map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })),
    ];

    const result = await this.modal.prompt({
      title: 'Request Substitution',
      inputs: [
        { key: 'substituteUserId', label: 'Substitute Person', type: 'select', options: userOptions, required: true },
        { key: 'reason', label: 'Reason', type: 'textarea', placeholder: 'Why do you need a substitute?', required: true },
      ],
      confirmText: 'Submit',
    });
    if (result && result['substituteUserId'] && result['reason']) {
      this.lineupsService.createSubstitutionRequest({
        lineupMemberId: memberId,
        substituteUserId: result['substituteUserId'],
        reason: result['reason'],
      }).subscribe({
        next: () => {
          this.toast.success('Substitution request submitted');
          if (this.lineup) this.loadSubstitutionRequests(this.lineup.id);
        },
      });
    }
  }

  // --- Substitution helpers ---

  canEdit(lineup: WorshipLineup): boolean {
    return lineup.submittedBy?.id === this.currentUserId && lineup.status !== 'REJECTED';
  }

  isHead(): boolean {
    return this.authService.hasRole('WORSHIP_TEAM_HEAD') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');
  }

  isSubstitutee(req: SubstitutionRequest): boolean {
    return req.substituteUser?.id === this.currentUserId;
  }

  isRequester(req: SubstitutionRequest): boolean {
    return req.requestedBy?.id === this.currentUserId;
  }

  getSubstitutionStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Awaiting head approval',
      HEAD_APPROVED: 'Awaiting substitute response',
      HEAD_REJECTED: 'Rejected by team head',
      ACCEPTED: 'Accepted',
      DECLINED: 'Declined',
      CANCELLED: 'Cancelled',
    };
    return map[status] ?? status;
  }

  getAcceptedSubForMember(memberId: string): SubstitutionRequest | undefined {
    return this.substitutionRequests.find(
      (s) => s.lineupMember?.id === memberId && s.status === 'ACCEPTED',
    );
  }

  getPendingSubForMember(memberId: string): SubstitutionRequest | undefined {
    return this.substitutionRequests.find(
      (s) => s.lineupMember?.id === memberId && (s.status === 'PENDING' || s.status === 'HEAD_APPROVED'),
    );
  }

  // --- Substitution actions ---

  headApproveSubstitution(requestId: string) {
    this.lineupsService.headDecideSubstitution(requestId, 'HEAD_APPROVED').subscribe({
      next: () => {
        this.toast.success('Substitution approved');
        if (this.lineup) this.loadSubstitutionRequests(this.lineup.id);
      },
      error: () => this.toast.error('Failed to approve substitution'),
    });
  }

  async headRejectSubstitution(requestId: string) {
    const result = await this.modal.prompt({
      title: 'Reject Substitution',
      message: 'Please provide a reason for rejecting this substitution request.',
      inputs: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true, placeholder: 'Why is this request being rejected?' }],
      confirmText: 'Reject',
    });
    if (!result) return;
    this.lineupsService.headDecideSubstitution(requestId, 'HEAD_REJECTED', result['reason']).subscribe({
      next: () => {
        this.toast.warning('Substitution rejected');
        if (this.lineup) this.loadSubstitutionRequests(this.lineup.id);
      },
      error: () => this.toast.error('Failed to reject substitution'),
    });
  }

  acceptSubstitution(requestId: string) {
    this.lineupsService.substituteRespond(requestId, true).subscribe({
      next: () => {
        this.toast.success('Substitution accepted');
        if (this.lineup) { this.loadLineup(this.lineup.id); this.loadSubstitutionRequests(this.lineup.id); }
      },
      error: () => this.toast.error('Failed to accept substitution'),
    });
  }

  async declineSubstitution(requestId: string) {
    const result = await this.modal.prompt({
      title: 'Decline Substitution',
      message: 'Please provide a reason for declining.',
      inputs: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true }],
      confirmText: 'Decline',
    });
    if (!result) return;
    this.lineupsService.substituteRespond(requestId, false, result['reason']).subscribe({
      next: () => {
        this.toast.warning('Substitution declined');
        if (this.lineup) this.loadSubstitutionRequests(this.lineup.id);
      },
      error: () => this.toast.error('Failed to decline substitution'),
    });
  }

  async cancelSubstitutionRequest(requestId: string) {
    const confirmed = await this.modal.confirm({ title: 'Cancel Substitution', message: 'Cancel this substitution request?' });
    if (!confirmed) return;
    this.lineupsService.cancelSubstitution(requestId).subscribe({
      next: () => {
        this.toast.success('Request cancelled');
        if (this.lineup) this.loadSubstitutionRequests(this.lineup.id);
      },
      error: () => this.toast.error('Failed to cancel request'),
    });
  }

  async editSubstitution(req: SubstitutionRequest) {
    const member = this.lineup?.members.find(m => m.id === req.lineupMember?.id);
    const roleToFetch = member
      ? this.instrumentRoleToUserRole(member.instrumentRole.name)
      : 'SINGER,GUITARIST,KEYBOARDIST,DRUMMER,BASSIST';

    const users = await this.http.get<User[]>(
      `${environment.apiUrl}/users/by-roles?roles=${roleToFetch}`
    ).toPromise().catch(() => [] as User[]);

    const userOptions = [
      { value: '', label: '— Select a person —' },
      ...(users || []).filter(u => u.id !== this.currentUserId).map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })),
    ];

    const result = await this.modal.prompt({
      title: 'Edit Substitution Request',
      inputs: [
        { key: 'substituteUserId', label: 'Substitute Person', type: 'select', options: userOptions, required: true, value: req.substituteUser?.id || '' },
        { key: 'reason', label: 'Reason', type: 'textarea', placeholder: 'Why do you need a substitute?', required: true, value: req.reason },
      ],
      confirmText: 'Save',
    });
    if (result && result['substituteUserId'] && result['reason']) {
      this.lineupsService.updateSubstitutionRequest(req.id, {
        substituteUserId: result['substituteUserId'],
        reason: result['reason'],
      }).subscribe({
        next: () => {
          this.toast.success('Substitution request updated');
          if (this.lineup) this.loadSubstitutionRequests(this.lineup.id);
        },
        error: () => this.toast.error('Failed to update substitution request'),
      });
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'CHANGES_REQUESTED': return 'warning';
      case 'HEAD_APPROVED': return 'primary';
      case 'HEAD_REJECTED': return 'danger';
      case 'ACCEPTED': return 'success';
      case 'DECLINED': return 'danger';
      case 'CANCELLED': return 'medium';
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
    if (member?.user.id === this.currentUserId) return true;
    // Accepted substitute can also act on behalf of this member
    const acceptedSub = this.getAcceptedSubForMember(memberId);
    return acceptedSub?.substituteUser?.id === this.currentUserId;
  }

  // --- Mention highlighting ---

  renderCommentContent(content: string, mentionedUsers: any[]): SafeHtml {
    if (!content) return this.sanitizer.bypassSecurityTrustHtml('');
    let result = this.escapeHtml(content);
    if (mentionedUsers?.length) {
      for (const user of mentionedUsers) {
        const name = `@${user.firstName} ${user.lastName}`;
        const escapedName = this.escapeHtml(name);
        result = result.replace(
          new RegExp(this.escapeRegex(escapedName), 'g'),
          `<span class="mention-highlight">${escapedName}</span>`,
        );
      }
    }
    result = result.replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(result);
  }

  get highlightedCommentHtml(): string {
    if (!this.commentText) return ' ';
    let result = this.escapeHtml(this.commentText);
    for (const user of this.allUsers) {
      const name = `@${user.firstName} ${user.lastName}`;
      if (!this.commentText.includes(name)) continue;
      const escapedName = this.escapeHtml(name);
      result = result.replace(
        new RegExp(this.escapeRegex(escapedName), 'g'),
        `<span class="mention-highlight-typing">${escapedName}</span>`,
      );
    }
    return result + ' '; // trailing space prevents overlay height collapse
  }

  onCommentScroll(event: Event, overlay: HTMLElement) {
    overlay.scrollTop = (event.target as HTMLTextAreaElement).scrollTop;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
