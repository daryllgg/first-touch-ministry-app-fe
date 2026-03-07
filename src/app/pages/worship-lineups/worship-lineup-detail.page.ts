import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonBackButton, IonButtons,
  IonBadge, IonIcon, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonNote, IonAvatar, IonRefresher, IonRefresherContent,
  IonSkeletonText, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline, swapHorizontalOutline, alertCircleOutline, createOutline, refreshOutline, trashOutline, linkOutline, timeOutline } from 'ionicons/icons';
import { WorshipLineupsService } from '../../services/worship-lineups.service';
import { AuthService } from '../../services/auth.service';
import { WorshipLineup, SubstitutionRequest } from '../../interfaces/worship-lineup.interface';
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
    IonSkeletonText,
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
  private lineupId: string | null = null;
  private loadCount = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lineupsService: WorshipLineupsService,
    private authService: AuthService,
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

  get isSubmitter(): boolean {
    return this.lineup?.submittedBy?.id === this.currentUserId;
  }

  get sortedReviews() {
    if (!this.lineup?.reviews) return [];
    return [...this.lineup.reviews].reverse();
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
