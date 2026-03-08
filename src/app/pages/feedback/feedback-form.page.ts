import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonBackButton, IonButtons, IonSpinner,
} from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';
import { FeedbackService } from '../../services/feedback.service';
import { ToastService } from '../../components/toast/toast.service';

@Component({
  selector: 'app-feedback-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonBackButton, IonButtons, IonSpinner,
  ],
  templateUrl: './feedback-form.page.html',
  styleUrls: ['./feedback-form.page.scss'],
})
export class FeedbackFormPage {
  isWeb = environment.platform === 'web';
  form: FormGroup;
  isSubmitting = false;
  selectedScreenshot: File | null = null;
  screenshotPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private feedbackService: FeedbackService,
    private router: Router,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      category: ['', [Validators.required]],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  onScreenshotSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.selectedScreenshot = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.screenshotPreview = e.target?.result as string;
    };
    reader.readAsDataURL(this.selectedScreenshot);
    input.value = '';
  }

  removeScreenshot() {
    this.selectedScreenshot = null;
    this.screenshotPreview = null;
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('category', this.form.get('category')!.value);
    formData.append('subject', this.form.get('subject')!.value);
    formData.append('description', this.form.get('description')!.value);

    if (this.selectedScreenshot) {
      formData.append('screenshot', this.selectedScreenshot, this.selectedScreenshot.name);
    }

    this.feedbackService.create(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.success('Feedback submitted successfully');
        this.router.navigate(['/feedback']);
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.error('Failed to submit feedback');
      },
    });
  }
}
