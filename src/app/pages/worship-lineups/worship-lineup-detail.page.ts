import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonList, IonItem, IonLabel, IonBackButton, IonButtons,
  IonBadge, IonIcon, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonNote, IonAvatar, IonRefresher, IonRefresherContent,
  AlertController, ToastController, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline, swapHorizontalOutline, alertCircleOutline, createOutline, refreshOutline } from 'ionicons/icons';
import { WorshipLineupsService } from '../../services/worship-lineups.service';
import { AuthService } from '../../services/auth.service';
import { WorshipLineup, SubstitutionRequest } from '../../interfaces/worship-lineup.interface';
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
  private lineupId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lineupsService: WorshipLineupsService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ checkmarkOutline, closeOutline, swapHorizontalOutline, alertCircleOutline, createOutline, refreshOutline });
  }

  ngOnInit() {
    this.canReview = this.authService.hasRole('WORSHIP_TEAM_HEAD') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');

    this.currentUserId = this.authService.currentUser?.id ?? null;
    this.lineupId = this.route.snapshot.paramMap.get('id');
    if (this.lineupId) {
      this.loadLineup(this.lineupId);
      this.loadSubstitutionRequests(this.lineupId);
    }
  }

  ionViewWillEnter() {
    if (this.lineupId) {
      this.loadLineup(this.lineupId);
      this.loadSubstitutionRequests(this.lineupId);
    }
  }

  loadLineup(id: string) {
    this.lineupsService.findOne(id).subscribe({
      next: async (data) => {
        const isMember = data.members.some(
          (m) => m.user.id === this.currentUserId
        );
        const isSubmitter = data.submittedBy?.id === this.currentUserId;

        if (!isSubmitter && !isMember && !this.canReview) {
          const alert = await this.alertCtrl.create({
            header: 'Access Notice',
            message: 'You are no longer part of this lineup.',
            backdropDismiss: false,
            buttons: [
              {
                text: 'Go Back',
                handler: () => {
                  this.router.navigate(['/worship-lineups']);
                },
              },
            ],
          });
          await alert.present();
          return;
        }

        this.lineup = data;
        this.canRequestSubstitution = isMember;
      },
    });
  }

  loadSubstitutionRequests(id: string) {
    this.lineupsService.findSubstitutionRequests(id).subscribe({
      next: (data) => this.substitutionRequests = data,
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
    const alert = await this.alertCtrl.create({
      header: 'Approve Lineup',
      inputs: [
        { name: 'comment', type: 'textarea', placeholder: 'Add a note (optional)' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Approve',
          handler: (data) => {
            this.lineupsService.updateStatus(this.lineup!.id, 'APPROVED', data.comment || undefined).subscribe({
              next: async (updated) => {
                this.lineup = updated;
                const toast = await this.toastCtrl.create({ message: 'Lineup approved', duration: 2000, color: 'success', position: 'top' });
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

  async reject() {
    if (!this.lineup) return;
    const alert = await this.alertCtrl.create({
      header: 'Decline Lineup',
      inputs: [
        { name: 'comment', type: 'textarea', placeholder: 'Reason for declining (optional)' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Decline',
          handler: (data) => {
            this.lineupsService.updateStatus(this.lineup!.id, 'REJECTED', data.comment || undefined).subscribe({
              next: async (updated) => {
                this.lineup = updated;
                const toast = await this.toastCtrl.create({ message: 'Lineup declined', duration: 2000, color: 'danger', position: 'top' });
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

  async resubmit() {
    if (!this.lineup) return;
    this.lineupsService.resubmit(this.lineup.id).subscribe({
      next: async (data) => {
        this.lineup = data;
        const toast = await this.toastCtrl.create({ message: 'Lineup resubmitted', duration: 2000, color: 'success', position: 'top' });
        await toast.present();
      },
    });
  }

  async requestChanges() {
    if (!this.lineup) return;
    const alert = await this.alertCtrl.create({
      header: 'Request Changes',
      message: 'Please describe the changes needed:',
      inputs: [
        { name: 'comment', type: 'textarea', placeholder: 'What changes are needed?' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Submit',
          handler: (data) => {
            if (!data.comment) return false;
            this.lineupsService.requestChanges(this.lineup!.id, data.comment).subscribe({
              next: async (updated) => {
                this.lineup = updated;
                const toast = await this.toastCtrl.create({ message: 'Changes requested', duration: 2000, color: 'warning', position: 'top' });
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

  async requestSubstitution(memberId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Request Substitution',
      inputs: [
        { name: 'reason', type: 'textarea', placeholder: 'Reason for substitution' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Submit',
          handler: (data) => {
            if (!data.reason) return false;
            this.lineupsService.createSubstitutionRequest({
              lineupMemberId: memberId,
              reason: data.reason,
            }).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({ message: 'Substitution request submitted', duration: 2000, color: 'success', position: 'top' });
                await toast.present();
                if (this.lineup) this.loadSubstitutionRequests(this.lineup.id);
              },
            });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async approveSubstitution(requestId: string) {
    this.lineupsService.updateSubstitutionStatus(requestId, 'APPROVED').subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: 'Substitution approved', duration: 2000, color: 'success', position: 'top' });
        await toast.present();
        if (this.lineup) this.loadSubstitutionRequests(this.lineup.id);
      },
    });
  }

  async rejectSubstitution(requestId: string) {
    this.lineupsService.updateSubstitutionStatus(requestId, 'REJECTED').subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: 'Substitution rejected', duration: 2000, color: 'danger', position: 'top' });
        await toast.present();
        if (this.lineup) this.loadSubstitutionRequests(this.lineup.id);
      },
    });
  }

  async acceptSubstitution(requestId: string) {
    this.lineupsService.acceptSubstitution(requestId).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({ message: 'Substitution accepted', duration: 2000, color: 'success', position: 'top' });
        await toast.present();
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
