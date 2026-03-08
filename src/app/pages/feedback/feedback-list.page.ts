import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonFab, IonFabButton, IonIcon, IonSkeletonText,
  IonRefresher, IonRefresherContent, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';
import { Feedback } from '../../interfaces/feedback.interface';

@Component({
  selector: 'app-feedback-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonFab, IonFabButton, IonIcon, IonSkeletonText,
    IonRefresher, IonRefresherContent,
  ],
  templateUrl: './feedback-list.page.html',
  styleUrls: ['./feedback-list.page.scss'],
})
export class FeedbackListPage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  apiUrl = environment.apiUrl;
  feedbackList: Feedback[] = [];
  isLoading = true;
  isDev = false;

  // Filters (DEV only)
  filterCategory = '';
  filterStatus = '';

  constructor(
    private feedbackService: FeedbackService,
    private authService: AuthService,
    private router: Router,
  ) {
    addIcons({ addOutline });
  }

  ngOnInit() {
    this.isDev = this.authService.hasRole('DEV');
    this.loadFeedback();
  }

  ionViewWillEnter() {
    this.isDev = this.authService.hasRole('DEV');
    this.loadFeedback();
  }

  loadFeedback(event?: any) {
    this.isLoading = !event;
    this.feedbackService.findAll(
      this.filterCategory || undefined,
      this.filterStatus || undefined,
    ).subscribe({
      next: (data) => {
        this.feedbackList = data;
        this.isLoading = false;
        event?.target?.complete();
      },
      error: () => {
        this.isLoading = false;
        event?.target?.complete();
      },
    });
  }

  onFilterChange() {
    this.loadFeedback();
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

  openDetail(id: string) {
    this.router.navigate(['/feedback', id]);
  }
}
