import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonButton, IonItem, IonInput, IonLabel, IonSelect, IonSelectOption,
  IonList, IonAvatar, IonIcon, IonSpinner, IonBadge, IonTextarea,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, cameraOutline, personCircleOutline, logOutOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { User } from '../../interfaces/user.interface';
import { ToastService } from '../../components/toast/toast.service';
import { ModalService } from '../../components/modal/modal.service';
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
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  isWeb = environment.platform === 'web';
  user: User | null = null;
  editMode = false;
  isLoading = false;
  profileForm: FormGroup;
  apiUrl = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private toast: ToastService,
    private modal: ModalService,
    private router: Router,
  ) {
    addIcons({ createOutline, cameraOutline, personCircleOutline, logOutOutline });
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      contactNumber: [''],
      birthday: [''],
      gender: [''],
      address: [''],
      invitedBy: [''],
      facebookLink: [''],
      firstDateAttendedChurch: [''],
      dateBaptized: [''],
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
        middleName: this.user.middleName || '',
        lastName: this.user.lastName || '',
        contactNumber: this.user.contactNumber || '',
        birthday: this.user.birthday || '',
        gender: this.user.gender || '',
        address: this.user.address || '',
        invitedBy: this.user.invitedBy || '',
        facebookLink: this.user.facebookLink || '',
        firstDateAttendedChurch: this.user.firstDateAttendedChurch || '',
        dateBaptized: this.user.dateBaptized || '',
      });
    }
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.patchForm();
    }
  }

  onSave() {
    if (this.profileForm.invalid) return;
    this.isLoading = true;

    // Only send fields that have changed
    const changes: Record<string, any> = {};
    const formVal = this.profileForm.value;
    if (this.user) {
      if (formVal.firstName && formVal.firstName !== this.user.firstName) changes['firstName'] = formVal.firstName;
      if (formVal.middleName !== (this.user.middleName || '')) changes['middleName'] = formVal.middleName;
      if (formVal.lastName && formVal.lastName !== this.user.lastName) changes['lastName'] = formVal.lastName;
      if (formVal.contactNumber !== (this.user.contactNumber || '')) changes['contactNumber'] = formVal.contactNumber;
      if (formVal.birthday !== (this.user.birthday || '')) changes['birthday'] = formVal.birthday;
      if (formVal.gender !== (this.user.gender || '')) changes['gender'] = formVal.gender;
      if (formVal.address !== (this.user.address || '')) changes['address'] = formVal.address;
      if (formVal.invitedBy !== (this.user.invitedBy || '')) changes['invitedBy'] = formVal.invitedBy;
      if (formVal.facebookLink !== (this.user.facebookLink || '')) changes['facebookLink'] = formVal.facebookLink;
      if (formVal.firstDateAttendedChurch !== (this.user.firstDateAttendedChurch || '')) changes['firstDateAttendedChurch'] = formVal.firstDateAttendedChurch;
      if (formVal.dateBaptized !== (this.user.dateBaptized || '')) changes['dateBaptized'] = formVal.dateBaptized;
    }

    if (Object.keys(changes).length === 0) {
      this.isLoading = false;
      this.editMode = false;
      this.toast.warning('No changes detected.');
      return;
    }

    this.profileService.updateProfile(changes).subscribe({
      next: () => {
        this.isLoading = false;
        this.editMode = false;
        this.toast.success('Profile changes submitted for admin approval.');
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Failed to submit profile changes.');
      },
    });
  }

  async onPickProfilePicture() {
    const confirmed = await this.modal.confirm({
      title: 'Update Profile Picture',
      message: 'Choose how to update your profile picture:',
      confirmText: 'Take Photo',
      cancelText: 'Choose from Gallery',
    });
    if (confirmed) {
      this.takeProfilePhoto();
    } else {
      this.chooseFromGallery();
    }
  }

  private async takeProfilePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      if (image.dataUrl) {
        this.uploadProfilePictureFromDataUrl(image.dataUrl);
      }
    } catch {
      // User cancelled or camera not available
    }
  }

  private async chooseFromGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });
      if (image.dataUrl) {
        this.uploadProfilePictureFromDataUrl(image.dataUrl);
      }
    } catch {
      // User cancelled or gallery not available
    }
  }

  private uploadProfilePictureFromDataUrl(dataUrl: string) {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const file = new File([u8arr], 'profile-photo.jpg', { type: mime });

    const formData = new FormData();
    formData.append('file', file);

    this.profileService.uploadProfilePicture(formData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.authService.refreshCurrentUser();
        this.toast.success('Profile picture updated.');
      },
      error: () => {
        this.toast.error('Failed to upload profile picture.');
      },
    });
  }

  onProfilePictureChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    this.profileService.uploadProfilePicture(formData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.authService.refreshCurrentUser();
        this.toast.success('Profile picture updated.');
      },
      error: () => {
        this.toast.error('Failed to upload profile picture.');
      },
    });
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
