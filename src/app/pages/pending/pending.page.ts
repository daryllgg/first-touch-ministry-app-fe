import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButton,
  IonSpinner,
  IonIcon,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pending',
  templateUrl: './pending.page.html',
  styleUrls: ['./pending.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonSpinner, IonIcon],
})
export class PendingPage {
  isChecking = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
  ) {
    addIcons({ timeOutline });
  }

  async checkStatus() {
    this.isChecking = true;
    this.authService.getMe().subscribe({
      next: async (user) => {
        this.isChecking = false;
        if (user.isApproved) {
          const toast = await this.toastCtrl.create({
            message: 'Your account has been approved!',
            duration: 2000,
            color: 'success',
          });
          await toast.present();
          this.router.navigate(['/home']);
        } else {
          const toast = await this.toastCtrl.create({
            message: 'Your account is still pending approval.',
            duration: 2000,
            color: 'warning',
          });
          await toast.present();
        }
      },
      error: async () => {
        this.isChecking = false;
        const toast = await this.toastCtrl.create({
          message: 'Unable to check status. Please try again.',
          duration: 2000,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
