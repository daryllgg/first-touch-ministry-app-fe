import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonMenuButton, IonButtons, IonIcon, IonSpinner, IonSkeletonText,
  IonList, IonItem, IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, logOutOutline, heartOutline } from 'ionicons/icons';
import { PinService } from '../../services/pin.service';
import { PledgesService } from '../../services/pledges.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../components/toast/toast.service';
import { Pledge, GivingProgram } from '../../interfaces/pledge.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pledges',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonMenuButton, IonButtons, IonIcon, IonSpinner, IonSkeletonText,
    IonList, IonItem, IonLabel,
  ],
  templateUrl: './pledges.page.html',
  styleUrls: ['./pledges.page.scss'],
})
export class PledgesPage implements OnInit {
  isWeb = environment.platform === 'web';
  pinState: 'loading' | 'setup' | 'verify' | 'dashboard' = 'loading';
  pinInput = '';
  pinConfirm = '';
  pinError = '';
  isSubmittingPin = false;
  isAdmin = false;

  // Member data
  myPledges: Pledge[] = [];
  isLoadingPledges = false;

  // Admin data
  programs: GivingProgram[] = [];
  isLoadingPrograms = false;
  adminTab: 'programs' | 'analytics' = 'programs';

  constructor(
    private pinService: PinService,
    private pledgesService: PledgesService,
    private authService: AuthService,
    private toast: ToastService,
  ) {
    addIcons({ lockClosedOutline, logOutOutline, heartOutline });
  }

  ngOnInit() {
    this.isAdmin = this.authService.hasRole('PASTOR') ||
      this.authService.hasRole('ADMIN') ||
      this.authService.hasRole('SUPER_ADMIN');

    if (this.pinService.isPinVerified) {
      this.pinState = 'dashboard';
      this.loadDashboard();
      return;
    }

    this.pinService.checkHasPin().subscribe({
      next: (hasPin) => {
        this.pinState = hasPin ? 'verify' : 'setup';
      },
      error: () => {
        this.pinState = 'setup';
      },
    });
  }

  setupPin() {
    if (this.pinInput.length < 4 || this.pinInput.length > 6) {
      this.pinError = 'PIN must be 4-6 digits';
      return;
    }
    if (!/^\d+$/.test(this.pinInput)) {
      this.pinError = 'PIN must contain only numbers';
      return;
    }
    if (this.pinInput !== this.pinConfirm) {
      this.pinError = 'PINs do not match';
      return;
    }
    this.pinError = '';
    this.isSubmittingPin = true;
    this.pinService.setupPin(this.pinInput).subscribe({
      next: () => {
        this.toast.success('PIN set successfully');
        this.pinService.verifyPin(this.pinInput).subscribe({
          next: () => {
            this.pinState = 'dashboard';
            this.loadDashboard();
            this.isSubmittingPin = false;
          },
        });
      },
      error: (err) => {
        this.pinError = err.error?.message || 'Failed to set PIN';
        this.isSubmittingPin = false;
      },
    });
  }

  verifyPin() {
    if (!this.pinInput) {
      this.pinError = 'Please enter your PIN';
      return;
    }
    this.pinError = '';
    this.isSubmittingPin = true;
    this.pinService.verifyPin(this.pinInput).subscribe({
      next: () => {
        this.pinState = 'dashboard';
        this.loadDashboard();
        this.isSubmittingPin = false;
      },
      error: (err) => {
        this.pinError = err.error?.message || 'Invalid PIN';
        this.isSubmittingPin = false;
        this.pinInput = '';
      },
    });
  }

  loadDashboard() {
    if (this.isAdmin) {
      this.loadPrograms();
    } else {
      this.loadMyPledges();
    }
  }

  loadPrograms() {
    this.isLoadingPrograms = true;
    this.pledgesService.getPrograms().subscribe({
      next: (data) => {
        this.programs = data;
        this.isLoadingPrograms = false;
      },
      error: () => this.isLoadingPrograms = false,
    });
  }

  loadMyPledges() {
    this.isLoadingPledges = true;
    this.pledgesService.getMyPledges().subscribe({
      next: (data) => {
        this.myPledges = data;
        this.isLoadingPledges = false;
      },
      error: () => this.isLoadingPledges = false,
    });
  }

  getTotalPaid(pledge: Pledge): number {
    return pledge.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  }

  getTotalAmount(pledge: Pledge): number {
    if (pledge.monthlyAmounts) {
      return Object.values(pledge.monthlyAmounts).reduce((sum, v) => sum + Number(v), 0);
    }
    if (pledge.program.type === 'FAITH_PLEDGE') {
      return Number(pledge.pledgeAmount) * (pledge.totalMonths || 10);
    }
    return Number(pledge.pledgeAmount);
  }

  getRemaining(pledge: Pledge): number {
    return Math.max(0, this.getTotalAmount(pledge) - this.getTotalPaid(pledge));
  }

  getProgressPercent(pledge: Pledge): number {
    if (pledge.program.type !== 'FAITH_PLEDGE') return 0;
    const totalMonths = this.getMonthCount(pledge);
    return Math.min(100, (pledge.payments.length / totalMonths) * 100);
  }

  getMonthCount(pledge: Pledge): number {
    if (pledge.monthlyAmounts) return Object.keys(pledge.monthlyAmounts).length;
    return pledge.totalMonths || 10;
  }

  formatMonth(ym: string): string {
    if (!ym || ym === '—') return '—';
    const [year, month] = ym.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  getProgramTypeBadge(type: string): string {
    switch (type) {
      case 'SEED_FAITH': return 'Seed Faith';
      case 'FAITH_PLEDGE': return 'Faith Pledge';
      case 'CUSTOM': return 'Custom';
      default: return type;
    }
  }

  getProgramTypeClass(type: string): string {
    switch (type) {
      case 'SEED_FAITH': return 'badge-seed';
      case 'FAITH_PLEDGE': return 'badge-faith';
      case 'CUSTOM': return 'badge-custom';
      default: return '';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }
}
