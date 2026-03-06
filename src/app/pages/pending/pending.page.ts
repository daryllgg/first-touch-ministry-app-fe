import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButton,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../components/toast/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pending',
  templateUrl: './pending.page.html',
  styleUrls: ['./pending.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonSpinner, IonIcon],
})
export class PendingPage {
  isWeb = environment.platform === 'web';
  isChecking = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {
    addIcons({ timeOutline });
  }

  checkStatus() {
    this.isChecking = true;
    this.authService.getMe().subscribe({
      next: (user) => {
        this.isChecking = false;
        if (user.accountStatus === 'APPROVED') {
          this.toast.success('Your account has been approved!');
          this.router.navigate(['/home']);
        } else if (user.accountStatus === 'DECLINED') {
          this.toast.error(
            user.declineReason
              ? `Your account has been declined. Reason: ${user.declineReason}`
              : 'Your account has been declined.',
          );
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          this.toast.warning('Your account is still pending approval.');
        }
      },
      error: () => {
        this.isChecking = false;
        this.toast.error('Unable to check status. Please try again.');
      },
    });
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
