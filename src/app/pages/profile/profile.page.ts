import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonButton, IonItem, IonInput, IonLabel, IonSelect, IonSelectOption,
  IonList, IonAvatar, IonIcon, IonSpinner, IonBadge, IonTextarea,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, cameraOutline, personCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { User } from '../../interfaces/user.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonButton, IonItem, IonInput, IonLabel, IonSelect, IonSelectOption,
    IonList, IonAvatar, IonIcon, IonSpinner, IonBadge, IonTextarea,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>My Profile</ion-title>
        <ion-buttons slot="end">
          @if (!editMode) {
            <ion-button (click)="toggleEdit()">
              <ion-icon name="create-outline" slot="icon-only"></ion-icon>
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (user) {
        <!-- Profile Picture Section -->
        <div class="profile-header">
          <div class="avatar-wrapper">
            @if (user.profilePicture) {
              <ion-avatar class="profile-avatar">
                <img [src]="apiUrl + '/' + user.profilePicture" alt="Profile Picture" />
              </ion-avatar>
            } @else {
              <ion-icon name="person-circle-outline" class="default-avatar"></ion-icon>
            }
            <ion-button fill="clear" size="small" class="camera-btn" (click)="fileInput.click()">
              <ion-icon name="camera-outline" slot="icon-only"></ion-icon>
            </ion-button>
            <input type="file" #fileInput hidden accept="image/*" (change)="onProfilePictureChange($event)" />
          </div>
          <h2 class="profile-name">{{ user.firstName }} {{ user.lastName }}</h2>
          <p class="profile-email">{{ user.email }}</p>
          <div class="profile-roles">
            @for (role of user.roles; track role.id) {
              <ion-badge color="primary">{{ role.name }}</ion-badge>
            }
          </div>
        </div>

        @if (!editMode) {
          <!-- View Mode -->
          <ion-list class="profile-details" lines="full">
            <ion-item>
              <ion-label>
                <p>Contact Number</p>
                <h3>{{ user.contactNumber || 'Not set' }}</h3>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label>
                <p>Birthday</p>
                <h3>{{ user.birthday || 'Not set' }}</h3>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label>
                <p>Gender</p>
                <h3>{{ user.gender || 'Not set' }}</h3>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label>
                <p>Address</p>
                <h3>{{ user.address || 'Not set' }}</h3>
              </ion-label>
            </ion-item>
          </ion-list>
        } @else {
          <!-- Edit Mode -->
          <form [formGroup]="profileForm" (ngSubmit)="onSave()">
            <ion-list class="profile-details" lines="full">
              <ion-item>
                <ion-input
                  formControlName="firstName"
                  label="First Name"
                  labelPlacement="floating"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-input
                  formControlName="lastName"
                  label="Last Name"
                  labelPlacement="floating"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-input
                  formControlName="contactNumber"
                  label="Contact Number (+639XXXXXXXXX)"
                  labelPlacement="floating"
                  inputmode="tel"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-input
                  formControlName="birthday"
                  label="Birthday"
                  labelPlacement="floating"
                  type="date"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-select
                  formControlName="gender"
                  label="Gender"
                  labelPlacement="floating"
                  interface="popover"
                >
                  <ion-select-option value="MALE">Male</ion-select-option>
                  <ion-select-option value="FEMALE">Female</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-textarea
                  formControlName="address"
                  label="Address"
                  labelPlacement="floating"
                  rows="3"
                ></ion-textarea>
              </ion-item>
            </ion-list>

            <div class="form-actions">
              <ion-button expand="block" type="submit" [disabled]="isLoading || profileForm.invalid">
                @if (isLoading) {
                  <ion-spinner name="crescent"></ion-spinner>
                } @else {
                  Save Changes
                }
              </ion-button>
              <ion-button expand="block" fill="outline" (click)="toggleEdit()">
                Cancel
              </ion-button>
            </div>
          </form>
        }
      } @else {
        <div class="loading-wrapper">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .profile-header {
      text-align: center;
      padding: 16px 0 24px;
    }

    .avatar-wrapper {
      position: relative;
      display: inline-block;
    }

    .profile-avatar {
      width: 100px;
      height: 100px;
      margin: 0 auto;
    }

    .default-avatar {
      font-size: 100px;
      color: var(--ion-color-medium);
    }

    .camera-btn {
      position: absolute;
      bottom: 0;
      right: -8px;
      --padding-start: 6px;
      --padding-end: 6px;
      --background: var(--ion-color-primary);
      --color: white;
      --border-radius: 50%;
    }

    .profile-name {
      font-size: 1.4rem;
      font-weight: 700;
      margin: 12px 0 4px;
    }

    .profile-email {
      color: var(--ion-color-medium);
      margin: 0 0 12px;
    }

    .profile-roles {
      display: flex;
      gap: 6px;
      justify-content: center;
      flex-wrap: wrap;

      ion-badge {
        font-size: 0.75rem;
      }
    }

    .profile-details {
      margin-top: 8px;
      background: transparent;

      ion-item {
        --background: white;
        border-radius: 10px;
        margin-bottom: 8px;
        box-shadow: 0 1px 6px rgba(26, 58, 74, 0.06);
      }

      p {
        color: var(--ion-color-medium);
        font-size: 0.8rem;
      }

      h3 {
        font-size: 1rem;
      }
    }

    .form-actions {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .loading-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 50vh;
    }
  `],
})
export class ProfilePage implements OnInit {
  user: User | null = null;
  editMode = false;
  isLoading = false;
  profileForm: FormGroup;
  apiUrl = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private toastCtrl: ToastController,
  ) {
    addIcons({ createOutline, cameraOutline, personCircleOutline });
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      contactNumber: [''],
      birthday: [''],
      gender: [''],
      address: [''],
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  private loadProfile() {
    this.profileService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.authService.refreshCurrentUser();
        this.patchForm();
      },
    });
  }

  private patchForm() {
    if (this.user) {
      this.profileForm.patchValue({
        firstName: this.user.firstName || '',
        lastName: this.user.lastName || '',
        contactNumber: this.user.contactNumber || '',
        birthday: this.user.birthday || '',
        gender: this.user.gender || '',
        address: this.user.address || '',
      });
    }
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.patchForm();
    }
  }

  async onSave() {
    if (this.profileForm.invalid) return;
    this.isLoading = true;

    // Only send fields that have changed
    const changes: Record<string, any> = {};
    const formVal = this.profileForm.value;
    if (this.user) {
      if (formVal.firstName && formVal.firstName !== this.user.firstName) changes['firstName'] = formVal.firstName;
      if (formVal.lastName && formVal.lastName !== this.user.lastName) changes['lastName'] = formVal.lastName;
      if (formVal.contactNumber !== (this.user.contactNumber || '')) changes['contactNumber'] = formVal.contactNumber;
      if (formVal.birthday !== (this.user.birthday || '')) changes['birthday'] = formVal.birthday;
      if (formVal.gender !== (this.user.gender || '')) changes['gender'] = formVal.gender;
      if (formVal.address !== (this.user.address || '')) changes['address'] = formVal.address;
    }

    if (Object.keys(changes).length === 0) {
      this.isLoading = false;
      this.editMode = false;
      const toast = await this.toastCtrl.create({
        message: 'No changes detected.',
        duration: 2000,
        color: 'warning',
      });
      await toast.present();
      return;
    }

    this.profileService.updateProfile(changes).subscribe({
      next: async () => {
        this.isLoading = false;
        this.editMode = false;
        const toast = await this.toastCtrl.create({
          message: 'Profile changes submitted for admin approval.',
          duration: 3000,
          color: 'success',
        });
        await toast.present();
      },
      error: async () => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({
          message: 'Failed to submit profile changes.',
          duration: 3000,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  async onProfilePictureChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    this.profileService.uploadProfilePicture(formData).subscribe({
      next: async (updatedUser) => {
        this.user = updatedUser;
        this.authService.refreshCurrentUser();
        const toast = await this.toastCtrl.create({
          message: 'Profile picture updated.',
          duration: 2000,
          color: 'success',
        });
        await toast.present();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Failed to upload profile picture.',
          duration: 3000,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }
}
