import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonItem, IonInput, IonTextarea, IonBackButton, IonButtons, IonSpinner,
  IonSelect, IonSelectOption,
  ToastController,
} from '@ionic/angular/standalone';
import { AnnouncementsService } from '../../services/announcements.service';
import { User } from '../../interfaces/user.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-announcement-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonItem, IonInput, IonTextarea, IonBackButton, IonButtons, IonSpinner,
    IonSelect, IonSelectOption,
  ],
  templateUrl: './announcement-form.page.html',
  styleUrls: ['./announcement-form.page.scss'],
})
export class AnnouncementFormPage implements OnInit {
  isWeb = environment.platform === 'web';
  form: FormGroup;
  isLoading = false;
  selectedImages: File[] = [];
  imagePreviews: string[] = [];
  users: User[] = [];
  selectedMentions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private announcementsService: AnnouncementsService,
    private router: Router,
    private toastCtrl: ToastController,
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required]],
      content: ['', [Validators.required]],
      audience: ['PUBLIC'],
    });
  }

  ngOnInit() {
    this.http.get<User[]>(`${environment.apiUrl}/users`).subscribe({
      next: (data) => this.users = data,
    });
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const newFiles = Array.from(input.files);
    for (const file of newFiles) {
      this.selectedImages.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviews.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.isLoading = true;

    const formData = new FormData();
    formData.append('title', this.form.get('title')!.value);
    formData.append('content', this.form.get('content')!.value);
    formData.append('audience', this.form.get('audience')!.value);

    if (this.selectedMentions.length > 0) {
      formData.append('mentionedUserIds', JSON.stringify(this.selectedMentions));
    }

    for (const image of this.selectedImages) {
      formData.append('images', image, image.name);
    }

    this.announcementsService.create(formData).subscribe({
      next: async () => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({ message: 'Announcement created', duration: 2000, color: 'success', position: 'top' });
        await toast.present();
        this.router.navigate(['/announcements']);
      },
      error: async () => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({ message: 'Failed to create announcement', duration: 3000, color: 'danger', position: 'top' });
        await toast.present();
      },
    });
  }
}
