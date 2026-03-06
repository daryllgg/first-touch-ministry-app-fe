import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonItem, IonInput, IonTextarea, IonBackButton, IonButtons,
  IonSpinner, IonSelect, IonSelectOption, IonDatetime, IonLabel,
  IonIcon, IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, imageOutline, personOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { YouthProfilesService } from '../../services/youth-profiles.service';
import { YouthProfile, Station } from '../../interfaces/youth-profile.interface';
import { ToastService } from '../../components/toast/toast.service';
import { ModalService } from '../../components/modal/modal.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-youth-profile-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonItem, IonInput, IonTextarea, IonBackButton, IonButtons,
    IonSpinner, IonSelect, IonSelectOption, IonDatetime, IonLabel,
    IonIcon, IonNote,
  ],
  templateUrl: './youth-profile-form.page.html',
  styleUrls: ['./youth-profile-form.page.scss'],
})
export class YouthProfileFormPage implements OnInit {
  isWeb = environment.platform === 'web';
  form: FormGroup;
  isLoading = false;
  isEditMode = false;
  profileId: string | null = null;
  photoPreview: string | null = null;
  photoFile: File | null = null;
  existingProfile: YouthProfile | null = null;
  apiUrl = environment.apiUrl;
  stations: Station[] = [];

  constructor(
    private fb: FormBuilder,
    private youthProfilesService: YouthProfilesService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
    private modal: ModalService,
  ) {
    addIcons({ cameraOutline, imageOutline, personOutline });

    this.form = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      nickname: [''],
      birthDate: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      stationId: [''],
      motherName: [''],
      fatherName: [''],
      facebookLink: [''],
      contactNumber: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      address: [''],
      notes: [''],
    });
  }

  ngOnInit() {
    this.loadStations();
    this.profileId = this.route.snapshot.paramMap.get('id');
    if (this.profileId) {
      this.isEditMode = true;
      this.loadProfile(this.profileId);
    }
  }

  loadStations() {
    this.youthProfilesService.getStations().subscribe({
      next: (stations) => {
        this.stations = stations;
      },
    });
  }

  loadProfile(id: string) {
    this.isLoading = true;
    this.youthProfilesService.findOne(id).subscribe({
      next: (profile) => {
        this.existingProfile = profile;

        // Strip +639 prefix from contactNumber for the form field
        let contactSuffix = '';
        if (profile.contactNumber) {
          contactSuffix = profile.contactNumber.startsWith('+639')
            ? profile.contactNumber.substring(4)
            : profile.contactNumber;
        }

        this.form.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          nickname: profile.nickname || '',
          birthDate: profile.birthDate,
          gender: profile.gender,
          stationId: profile.station?.id || '',
          motherName: profile.motherName || '',
          fatherName: profile.fatherName || '',
          facebookLink: profile.facebookLink || '',
          contactNumber: contactSuffix,
          address: profile.address || '',
          notes: profile.notes || '',
        });
        if (profile.photo) {
          this.photoPreview = `${this.apiUrl}/uploads/${profile.photo}`;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      if (image.dataUrl) {
        this.photoPreview = image.dataUrl;
        this.photoFile = this.dataUrlToFile(image.dataUrl, 'photo.jpg');
      }
    } catch (err) {
      // User cancelled or camera not available
    }
  }

  async choosePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });
      if (image.dataUrl) {
        this.photoPreview = image.dataUrl;
        this.photoFile = this.dataUrlToFile(image.dataUrl, 'photo.jpg');
      }
    } catch (err) {
      // User cancelled or gallery not available
    }
  }

  private dataUrlToFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  onDateChange(event: any) {
    const value = event.detail.value;
    if (value) {
      // Extract just the date part (YYYY-MM-DD) from the ISO string
      const dateOnly = value.substring(0, 10);
      this.form.patchValue({ birthDate: dateOnly });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    const formData = new FormData();

    const values = this.form.value;
    Object.keys(values).forEach((key) => {
      if (key === 'contactNumber') {
        // Prepend +639 to the 9-digit suffix
        if (values[key]) {
          formData.append('contactNumber', `+639${values[key]}`);
        }
      } else if (values[key] !== null && values[key] !== undefined && values[key] !== '') {
        formData.append(key, values[key]);
      }
    });

    if (this.photoFile) {
      formData.append('photo', this.photoFile);
    }

    if (this.isEditMode && this.profileId) {
      this.youthProfilesService.update(this.profileId, formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.toast.success('Profile updated');
          this.router.navigate(['/youth-profiles', this.profileId]);
        },
        error: () => {
          this.isLoading = false;
          this.toast.error('Failed to update profile');
        },
      });
    } else {
      this.youthProfilesService.create(formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.toast.success('Profile created');
          this.router.navigate(['/youth-profiles']);
        },
        error: () => {
          this.isLoading = false;
          this.toast.error('Failed to create profile');
        },
      });
    }
  }
}
