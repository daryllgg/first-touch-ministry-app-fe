import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonItem, IonInput, IonTextarea, IonBackButton, IonButtons,
  IonSpinner, IonSelect, IonSelectOption, IonLabel, IonIcon, IonList,
  IonDatetime, IonDatetimeButton, IonModal,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline, calendarOutline } from 'ionicons/icons';
import { WorshipLineupsService } from '../../services/worship-lineups.service';
import { InstrumentRole } from '../../interfaces/worship-lineup.interface';
import { User } from '../../interfaces/user.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-worship-lineup-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonItem, IonInput, IonTextarea, IonBackButton, IonButtons,
    IonSpinner, IonSelect, IonSelectOption, IonLabel, IonIcon, IonList,
    IonDatetime, IonDatetimeButton, IonModal,
  ],
  templateUrl: './worship-lineup-form.page.html',
  styleUrls: ['./worship-lineup-form.page.scss'],
})
export class WorshipLineupFormPage implements OnInit {
  form: FormGroup;
  isLoading = false;
  users: User[] = [];
  singerUsers: User[] = [];
  instrumentRoles: InstrumentRole[] = [];
  todayDate = new Date().toISOString().split('T')[0];

  private instrumentRoleToUserRoles: Record<string, string[]> = {
    'Singer': ['SINGER'],
    'Drummer': ['DRUMMER'],
    'Bassist': ['BASSIST'],
    'Acoustic Guitarist': ['GUITARIST'],
    'Electric Guitarist': ['GUITARIST'],
    'Rhythm Guitarist': ['GUITARIST'],
    'Keyboardist': ['KEYBOARDIST'],
    'Sustain Piano': ['KEYBOARDIST'],
    'Others': ['WORSHIP_LEADER', 'WORSHIP_TEAM_HEAD', 'GUITARIST', 'KEYBOARDIST', 'DRUMMER', 'BASSIST', 'SINGER'],
  };

  serviceTypeOptions = [
    { value: 'SUNDAY_SERVICE', label: 'Sunday Service' },
    { value: 'PLUG_IN_WORSHIP', label: 'Plug In Worship' },
    { value: 'YOUTH_SERVICE', label: 'Youth Service' },
    { value: 'SPECIAL_EVENT', label: 'Special Event' },
  ];

  constructor(
    private fb: FormBuilder,
    private lineupsService: WorshipLineupsService,
    private http: HttpClient,
    private router: Router,
    private toastCtrl: ToastController,
  ) {
    addIcons({ addOutline, trashOutline, calendarOutline });

    this.form = this.fb.group({
      serviceType: ['', [Validators.required]],
      customServiceName: [''],
      notes: [''],
      dates: this.fb.array([]),
      members: this.fb.array([]),
      songs: this.fb.array([]),
    });
  }

  ngOnInit() {
    this.lineupsService.getInstrumentRoles().subscribe({
      next: (data) => this.instrumentRoles = data,
    });
    this.http.get<User[]>(`${environment.apiUrl}/users`).subscribe({
      next: (data) => this.users = data,
    });
    this.http.get<User[]>(`${environment.apiUrl}/users/by-roles?roles=SINGER`).subscribe({
      next: (data) => this.singerUsers = data,
    });
  }

  get dates(): FormArray {
    return this.form.get('dates') as FormArray;
  }

  get members(): FormArray {
    return this.form.get('members') as FormArray;
  }

  get songs(): FormArray {
    return this.form.get('songs') as FormArray;
  }

  get isSpecialEvent(): boolean {
    return this.form.get('serviceType')?.value === 'SPECIAL_EVENT';
  }

  addDate() {
    this.dates.push(this.fb.control(this.todayDate, [Validators.required]));
  }

  removeDate(index: number) {
    this.dates.removeAt(index);
  }

  addMember() {
    this.members.push(this.fb.group({
      userId: ['', [Validators.required]],
      instrumentRoleId: ['', [Validators.required]],
      customRoleName: [''],
    }));
  }

  removeMember(index: number) {
    this.members.removeAt(index);
  }

  addSong() {
    this.songs.push(this.fb.group({
      title: ['', [Validators.required]],
      link: [''],
      singerId: [''],
    }));
  }

  removeSong(index: number) {
    this.songs.removeAt(index);
  }

  onRoleChange(memberGroup: AbstractControl) {
    memberGroup.get('userId')?.setValue('');
  }

  onDateChange(index: number, event: any) {
    const value = event.detail.value;
    if (value) {
      this.dates.at(index).setValue(value.split('T')[0]);
    }
  }

  getInstrumentRoleName(memberGroup: AbstractControl): string {
    const roleId = memberGroup.get('instrumentRoleId')?.value;
    const role = this.instrumentRoles.find(r => r.id === roleId);
    return role?.name || '';
  }

  isOthersRole(memberGroup: AbstractControl): boolean {
    return this.getInstrumentRoleName(memberGroup) === 'Others';
  }

  getFilteredUsers(memberGroup: AbstractControl): User[] {
    const roleName = this.getInstrumentRoleName(memberGroup);
    if (!roleName) return this.users;

    const allowedRoles = this.instrumentRoleToUserRoles[roleName];
    if (!allowedRoles) return this.users;

    const filtered = this.users.filter(u =>
      u.roles.some(r => allowedRoles.includes(r.name))
    );
    return filtered.length > 0 ? filtered : this.users;
  }

  onSubmit() {
    if (this.form.invalid || this.dates.length === 0 || this.songs.length === 0 || this.members.length === 0) return;
    this.isLoading = true;

    const formValue = this.form.value;
    const payload: any = {
      dates: formValue.dates,
      serviceType: formValue.serviceType,
      notes: formValue.notes || undefined,
      members: formValue.members.map((m: any) => ({
        userId: m.userId,
        instrumentRoleId: m.instrumentRoleId,
        customRoleName: m.customRoleName || undefined,
      })),
    };

    if (formValue.serviceType === 'SPECIAL_EVENT' && formValue.customServiceName) {
      payload.customServiceName = formValue.customServiceName;
    }

    if (formValue.songs && formValue.songs.length > 0) {
      payload.songs = formValue.songs.map((s: any) => ({
        title: s.title,
        link: s.link || undefined,
        singerId: s.singerId || undefined,
      }));
    }

    this.lineupsService.create(payload).subscribe({
      next: async () => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({ message: 'Lineup created', duration: 2000, color: 'success' });
        await toast.present();
        this.router.navigate(['/worship-lineups']);
      },
      error: async () => {
        this.isLoading = false;
        const toast = await this.toastCtrl.create({ message: 'Failed to create lineup', duration: 3000, color: 'danger' });
        await toast.present();
      },
    });
  }
}
