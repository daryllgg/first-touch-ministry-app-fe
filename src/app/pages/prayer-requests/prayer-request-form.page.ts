import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonItem, IonTextarea, IonBackButton, IonButtons, IonSpinner,
} from '@ionic/angular/standalone';
import { PrayerRequestsService } from '../../services/prayer-requests.service';
import { ToastService } from '../../components/toast/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-prayer-request-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonItem, IonTextarea, IonBackButton, IonButtons, IonSpinner,
  ],
  templateUrl: './prayer-request-form.page.html',
  styleUrls: ['./prayer-request-form.page.scss'],
})
export class PrayerRequestFormPage {
  isWeb = environment.platform === 'web';
  form: FormGroup;
  isLoading = false;
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private prayerRequestsService: PrayerRequestsService,
    private router: Router,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      content: ['', [Validators.required]],
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.selectedImage = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(this.selectedImage);

    // Reset the input so the same file can be selected again if removed
    input.value = '';
  }

  removeImage() {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.isLoading = true;

    const formData = new FormData();
    formData.append('content', this.form.get('content')!.value);

    if (this.selectedImage) {
      formData.append('image', this.selectedImage, this.selectedImage.name);
    }

    this.prayerRequestsService.create(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success('Prayer request submitted');
        this.router.navigate(['/prayer-requests']);
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Failed to submit');
      },
    });
  }
}
