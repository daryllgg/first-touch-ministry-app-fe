import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonItem, IonInput, IonTextarea, IonBackButton, IonButtons, IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { AnnouncementsService } from '../../services/announcements.service';

@Component({
  selector: 'app-announcement-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonItem, IonInput, IonTextarea, IonBackButton, IonButtons, IonSpinner,
  ],
  templateUrl: './announcement-form.page.html',
})
export class AnnouncementFormPage {
  form: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private announcementsService: AnnouncementsService,
    private router: Router,
    private toastCtrl: ToastController,
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required]],
      content: ['', [Validators.required]],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.isLoading = true;
    this.announcementsService.create(this.form.value).subscribe({
      next: async () => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({ message: 'Announcement created', duration: 2000, color: 'success' });
        await toast.present();
        this.router.navigate(['/announcements']);
      },
      error: async () => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({ message: 'Failed to create announcement', duration: 3000, color: 'danger' });
        await toast.present();
      },
    });
  }
}
