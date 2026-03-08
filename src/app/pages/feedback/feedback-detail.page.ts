import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonBackButton, IonButtons, IonSkeletonText, IonSpinner, ViewWillEnter,
} from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../components/toast/toast.service';
import { Feedback } from '../../interfaces/feedback.interface';

@Component({
  selector: 'app-feedback-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonBackButton, IonButtons, IonSkeletonText, IonSpinner,
  ],
  templateUrl: './feedback-detail.page.html',
  styleUrls: ['./feedback-detail.page.scss'],
})
export class FeedbackDetailPage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  apiUrl = environment.apiUrl;
  feedback: Feedback | null = null;
  isLoading = true;
  isDev = false;
  currentUserId = '';
  replyMessage = '';
  isReplying = false;
  isTogglingStatus = false;

  private feedbackId = '';

  constructor(
    private route: ActivatedRoute,
    private feedbackService: FeedbackService,
    private authService: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.isDev = this.authService.hasRole('DEV');
    this.currentUserId = this.authService.currentUser?.id ?? '';
    this.feedbackId = this.route.snapshot.paramMap.get('id') || '';
    this.loadFeedback();
  }

  ionViewWillEnter() {
    this.isDev = this.authService.hasRole('DEV');
    this.currentUserId = this.authService.currentUser?.id ?? '';
    this.feedbackId = this.route.snapshot.paramMap.get('id') || '';
    this.loadFeedback();
  }

  loadFeedback() {
    this.isLoading = true;
    this.feedbackService.findOne(this.feedbackId).subscribe({
      next: (fb) => {
        this.feedback = fb;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Failed to load feedback');
      },
    });
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'BUG_REPORT': return 'Bug Report';
      case 'FEATURE_REQUEST': return 'Feature Request';
      case 'GENERAL': return 'General';
      default: return category;
    }
  }

  getCategoryClass(category: string): string {
    switch (category) {
      case 'BUG_REPORT': return 'badge-danger';
      case 'FEATURE_REQUEST': return 'badge-info';
      case 'GENERAL': return 'badge-default';
      default: return '';
    }
  }

  toggleStatus() {
    if (!this.feedback) return;
    this.isTogglingStatus = true;
    const newStatus = this.feedback.status === 'OPEN' ? 'RESOLVED' : 'OPEN';
    this.feedbackService.updateStatus(this.feedback.id, newStatus).subscribe({
      next: (updated) => {
        this.feedback!.status = updated.status;
        this.isTogglingStatus = false;
        this.toast.success(`Status updated to ${newStatus}`);
      },
      error: () => {
        this.isTogglingStatus = false;
        this.toast.error('Failed to update status');
      },
    });
  }

  submitReply() {
    if (!this.replyMessage.trim() || !this.feedback) return;
    this.isReplying = true;
    this.feedbackService.addReply(this.feedback.id, this.replyMessage.trim()).subscribe({
      next: (reply) => {
        this.feedback!.replies = [...(this.feedback!.replies || []), reply];
        this.replyMessage = '';
        this.isReplying = false;
      },
      error: () => {
        this.isReplying = false;
        this.toast.error('Failed to send reply');
      },
    });
  }

  getProfilePicUrl(pic: string): string {
    if (!pic) return '';
    return `${this.apiUrl}/uploads/${pic}`;
  }

  getScreenshotUrl(screenshot: string): string {
    return `${this.apiUrl}/uploads/${screenshot}`;
  }

  isReplyByDev(reply: any): boolean {
    return reply.user?.roles?.some((r: any) => r.name === 'DEV') ?? false;
  }
}
