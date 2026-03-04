import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
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
export class RegisterPage {
  registerForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
    });
  }

  onRegister() {
    if (this.registerForm.invalid) return;
    this.isLoading = true;

    this.authService.register(this.registerForm.value).subscribe({
      next: async () => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({
          message: 'Registration successful! Please wait for admin approval.',
          duration: 3000,
          color: 'success',
        });
        await toast.present();
        this.router.navigate(['/pending']);
      },
      error: async (err) => {
        this.isLoading = false;
        const message =
          err.status === 409
            ? 'Email already registered'
            : 'Registration failed. Please try again.';
        const toast = await this.toastCtrl.create({
          message,
          duration: 3000,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }
}
