import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonItem, IonTextarea, IonBackButton, IonButtons, IonSpinner,
  IonToggle, IonLabel,
  ToastController,
} from '@ionic/angular/standalone';
import { PrayerRequestsService } from '../../services/prayer-requests.service';

@Component({
  selector: 'app-prayer-request-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonItem, IonTextarea, IonBackButton, IonButtons, IonSpinner,
    IonToggle, IonLabel,
  ],
  templateUrl: './prayer-request-form.page.html',
})
export class PrayerRequestFormPage {
  form: FormGroup;
  isLoading = false;
  isPrivate = false;

  constructor(
    private fb: FormBuilder,
    private prayerRequestsService: PrayerRequestsService,
    private router: Router,
    private toastCtrl: ToastController,
  ) {
    this.form = this.fb.group({
      content: ['', [Validators.required]],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.isLoading = true;
    const data = {
      ...this.form.value,
      visibility: this.isPrivate ? 'PRIVATE' : 'PUBLIC',
    };
    this.prayerRequestsService.create(data).subscribe({
      next: async () => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({ message: 'Prayer request submitted', duration: 2000, color: 'success' });
        await toast.present();
        this.router.navigate(['/prayer-requests']);
      },
      error: async () => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({ message: 'Failed to submit', duration: 3000, color: 'danger' });
        await toast.present();
      },
    });
  }
}
