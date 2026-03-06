import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../components/toast/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.page.html',
  styleUrls: ['./verify-email.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
  ],
})
export class VerifyEmailPage {
  isWeb = environment.platform === 'web';
  step: 'email' | 'otp' = 'email';
  email = '';
  otp = '';
  isLoading = false;
  resendCooldown = 0;
  private resendTimer: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {}

  onSendOtp() {
    if (!this.email || this.isLoading) return;
    this.isLoading = true;

    // Check OTP status first
    this.authService.getOtpStatus(this.email).subscribe({
      next: (res) => {
        if (res.status === 'verified') {
          this.isLoading = false;
          this.router.navigate(['/register'], {
            queryParams: { email: this.email },
          });
          return;
        }

        if (res.status === 'pending') {
          this.isLoading = false;
          this.step = 'otp';
          this.startResendCooldown();
          this.toast.success('Code already sent to your email');
          return;
        }

        // Status is 'none' — send new OTP
        this.sendNewOtp();
      },
      error: (err) => {
        this.isLoading = false;
        const message =
          err.status === 409
            ? 'Email already registered'
            : 'Failed to send code. Please try again.';
        this.toast.error(message);
      },
    });
  }

  private sendNewOtp() {
    this.authService.sendOtp(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.step = 'otp';
        this.startResendCooldown();
        this.toast.success('Verification code sent to your email');
      },
      error: (err) => {
        this.isLoading = false;
        const message =
          err.status === 409
            ? 'Email already registered'
            : 'Failed to send code. Please try again.';
        this.toast.error(message);
      },
    });
  }

  onVerifyOtp() {
    if (!this.otp || this.otp.length !== 6 || this.isLoading) return;
    this.isLoading = true;

    this.authService.verifyOtp(this.email, this.otp).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/register'], {
          queryParams: { email: this.email },
        });
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Invalid or expired code');
      },
    });
  }

  onResend() {
    if (this.resendCooldown > 0) return;
    this.isLoading = true;
    this.sendNewOtp();
  }

  private startResendCooldown() {
    this.resendCooldown = 60;
    clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.resendTimer);
      }
    }, 1000);
  }

  goBack() {
    this.step = 'email';
    this.otp = '';
    clearInterval(this.resendTimer);
    this.resendCooldown = 0;
  }
}
