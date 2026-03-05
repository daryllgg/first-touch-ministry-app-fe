import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  ToastController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

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
    IonSelect,
    IonSelectOption,
    IonTextarea,
  ],
})
export class RegisterPage implements OnInit {
  isWeb = environment.platform === 'web';
  registerForm: FormGroup;
  isLoading = false;
  verifiedEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      contactNumber: ['', [Validators.pattern(/^\+639\d{9}$/)]],
      birthday: [''],
      gender: [''],
      address: [''],
    });
  }

  ngOnInit() {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (!email) {
      this.router.navigate(['/verify-email']);
      return;
    }
    this.verifiedEmail = email;
    this.registerForm.patchValue({ email });
    this.registerForm.get('email')?.disable();
  }

  onRegister() {
    if (this.registerForm.invalid) return;
    this.isLoading = true;

    // Build payload, omitting empty optional fields
    const formVal = this.registerForm.getRawValue();
    const payload: any = {
      email: formVal.email,
      password: formVal.password,
      firstName: formVal.firstName,
      lastName: formVal.lastName,
    };
    if (formVal.contactNumber) payload.contactNumber = formVal.contactNumber;
    if (formVal.birthday) payload.birthday = formVal.birthday;
    if (formVal.gender) payload.gender = formVal.gender;
    if (formVal.address) payload.address = formVal.address;

    this.authService.register(payload).subscribe({
      next: async () => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({
          message: 'Registration successful! Please wait for admin approval.',
          duration: 3000,
          color: 'success',
          position: 'top',
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
          position: 'top',
        });
        await toast.present();
      },
    });
  }
}
