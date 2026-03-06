import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonDatetime,
  IonLabel,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../components/toast/toast.service';
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
    IonDatetime,
    IonLabel,
  ],
})
export class RegisterPage implements OnInit {
  isWeb = environment.platform === 'web';
  registerForm: FormGroup;
  isLoading = false;
  verifiedEmail = '';
  showPassword = false;
  showConfirmPassword = false;
  memberNames: string[] = [];
  filteredMemberNames: string[] = [];

  // Wizard steps
  currentStep = 1;
  totalSteps = 3;

  // Date picker toggles
  showBirthdayPicker = false;
  showFirstDatePicker = false;
  showBaptizedPicker = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
    private http: HttpClient,
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      middleName: [''],
      lastName: ['', [Validators.required]],
      contactNumber: ['', [Validators.pattern(/^\+639\d{9}$/)]],
      birthday: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      address: [''],
      invitedBy: [''],
      facebookLink: [''],
      firstDateAttendedChurch: [''],
      dateBaptized: [''],
    }, { validators: this.passwordMatchValidator });
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

    this.http.get<{ name: string }[]>(`${environment.apiUrl}/users/member-names`).subscribe({
      next: (names) => {
        this.memberNames = names.map(n => n.name);
        this.filteredMemberNames = this.memberNames;
      },
      error: () => {},
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
      return { passwordMismatch: true };
    }
    if (confirmPassword?.hasError('passwordMismatch')) {
      const errors = { ...confirmPassword.errors };
      delete errors['passwordMismatch'];
      confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
    }
    return null;
  }

  // Step navigation
  nextStep() {
    if (this.canProceed()) {
      this.currentStep = Math.min(this.currentStep + 1, this.totalSteps);
    }
  }

  prevStep() {
    this.currentStep = Math.max(this.currentStep - 1, 1);
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1: {
        const fn = this.registerForm.get('firstName');
        const ln = this.registerForm.get('lastName');
        const bday = this.registerForm.get('birthday');
        const gender = this.registerForm.get('gender');
        return !!fn?.value?.trim() && !!ln?.value?.trim() && !!bday?.value && !!gender?.value;
      }
      case 2: {
        const email = this.registerForm.get('email');
        const pw = this.registerForm.get('password');
        const cpw = this.registerForm.get('confirmPassword');
        return !email?.invalid && !pw?.invalid && !!cpw?.value && !this.registerForm.hasError('passwordMismatch');
      }
      case 3:
        return true;
      default:
        return false;
    }
  }

  get stepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Personal Information';
      case 2: return 'Account Setup';
      case 3: return 'Church Details';
      default: return '';
    }
  }

  get stepSubtitle(): string {
    switch (this.currentStep) {
      case 1: return 'Tell us about yourself';
      case 2: return 'Set up your login credentials';
      case 3: return 'Share your church background';
      default: return '';
    }
  }

  // Date picker helpers
  formatDisplayDate(value: string): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  onDateChange(event: any, controlName: string) {
    const val = event.detail.value;
    if (val) {
      this.registerForm.patchValue({ [controlName]: val.split('T')[0] });
    }
    this.showBirthdayPicker = false;
    this.showFirstDatePicker = false;
    this.showBaptizedPicker = false;
  }

  toggleDatePicker(picker: 'birthday' | 'firstDate' | 'baptized', event?: Event) {
    event?.stopPropagation();
    this.showBirthdayPicker = picker === 'birthday' ? !this.showBirthdayPicker : false;
    this.showFirstDatePicker = picker === 'firstDate' ? !this.showFirstDatePicker : false;
    this.showBaptizedPicker = picker === 'baptized' ? !this.showBaptizedPicker : false;
  }

  onInvitedByInput() {
    const val = (this.registerForm.get('invitedBy')?.value || '').toLowerCase();
    this.filteredMemberNames = val
      ? this.memberNames.filter(n => n.toLowerCase().includes(val))
      : this.memberNames;
  }

  onRegister() {
    if (this.registerForm.invalid) return;
    this.isLoading = true;

    const formVal = this.registerForm.getRawValue();
    const payload: any = {
      email: formVal.email,
      password: formVal.password,
      firstName: formVal.firstName,
      lastName: formVal.lastName,
    };
    if (formVal.middleName) payload.middleName = formVal.middleName;
    if (formVal.contactNumber) payload.contactNumber = formVal.contactNumber;
    if (formVal.birthday) payload.birthday = formVal.birthday;
    if (formVal.gender) payload.gender = formVal.gender;
    if (formVal.address) payload.address = formVal.address;
    if (formVal.invitedBy) payload.invitedBy = formVal.invitedBy;
    if (formVal.facebookLink) payload.facebookLink = formVal.facebookLink;
    if (formVal.firstDateAttendedChurch) payload.firstDateAttendedChurch = formVal.firstDateAttendedChurch;
    if (formVal.dateBaptized) payload.dateBaptized = formVal.dateBaptized;

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success('Registration successful! Please wait for admin approval.');
        this.router.navigate(['/pending']);
      },
      error: (err) => {
        this.isLoading = false;
        const message =
          err.status === 409
            ? 'Email already registered'
            : 'Registration failed. Please try again.';
        this.toast.error(message);
      },
    });
  }
}
