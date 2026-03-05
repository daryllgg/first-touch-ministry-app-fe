import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
  ],
})
export class LoginPage {
  isWeb = environment.platform === 'web';
  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onLogin() {
    if (this.loginForm.invalid) return;
    this.isLoading = true;

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.user.isApproved) {
          this.router.navigate(['/home']);
        } else {
          this.router.navigate(['/pending']);
        }
      },
      error: async () => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({
          message: 'Invalid email or password',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
      },
    });
  }
}
