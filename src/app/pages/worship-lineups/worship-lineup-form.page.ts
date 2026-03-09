import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonItem, IonInput, IonTextarea, IonBackButton, IonButtons,
  IonSpinner, IonSelect, IonSelectOption, IonLabel, IonIcon, IonList,
  IonDatetime, IonDatetimeButton, IonModal,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline, calendarOutline, musicalNotesOutline, musicalNoteOutline, peopleOutline } from 'ionicons/icons';
import { WorshipLineupsService } from '../../services/worship-lineups.service';
import { InstrumentRole } from '../../interfaces/worship-lineup.interface';
import { User } from '../../interfaces/user.interface';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../components/toast/toast.service';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';
import { TimePickerComponent } from '../../components/time-picker/time-picker.component';
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
    DatePickerComponent,
    TimePickerComponent,
  ],
  templateUrl: './worship-lineup-form.page.html',
  styleUrls: ['./worship-lineup-form.page.scss'],
})
export class WorshipLineupFormPage implements OnInit {
  isWeb = environment.platform === 'web';
  form: FormGroup;
  isLoading = false;
  users: User[] = [];
  singerUsers: User[] = [];
  instrumentRoles: InstrumentRole[] = [];
  todayDate = new Date().toISOString().split('T')[0];
  lineupId: string | null = null;
  isEditMode = false;
  showServiceDatePicker = false;
  showRehearsalDatePicker = false;
  showConfirmDialog = false;
  songYoutubeMeta: Record<number, { title: string; thumbnailUrl: string } | null> = {};
  isLoadingYoutube: Record<number, boolean> = {};
  private initialFormSnapshot: string = '';


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
    private route: ActivatedRoute,
    private lineupsService: WorshipLineupsService,
    private http: HttpClient,
    private router: Router,
    private toast: ToastService,
  ) {
    addIcons({ addOutline, trashOutline, calendarOutline, musicalNotesOutline, musicalNoteOutline, peopleOutline });

    this.form = this.fb.group({
      serviceType: ['', [Validators.required]],
      customServiceName: [''],
      notes: [''],
      rehearsalDate: [''],
      overallTheme: [''],
      rehearsalTime: [''],
      dates: this.fb.array([]),
      members: this.fb.array([]),
      songs: this.fb.array([]),
    });
  }

  ngOnInit() {
    this.lineupsService.getInstrumentRoles().subscribe({
      next: (data) => {
        this.instrumentRoles = data;
        this.loadEditData();
      },
    });
    const allRoles = 'WORSHIP_LEADER,WORSHIP_TEAM_HEAD,GUITARIST,KEYBOARDIST,DRUMMER,BASSIST,SINGER';
    this.http.get<User[]>(`${environment.apiUrl}/users/by-roles?roles=${allRoles}`).subscribe({
      next: (data) => this.users = data,
    });
    this.http.get<User[]>(`${environment.apiUrl}/users/by-roles?roles=SINGER`).subscribe({
      next: (data) => this.singerUsers = data,
    });

    this.lineupId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.lineupId;
  }

  private loadEditData() {
    if (!this.lineupId) return;
    this.lineupsService.findOne(this.lineupId).subscribe({
      next: (lineup) => {
        // Also load substitution requests to swap accepted subs into member slots
        this.lineupsService.findSubstitutionRequests(this.lineupId!).subscribe({
          next: (subs) => this.populateForm(lineup, subs),
          error: () => this.populateForm(lineup, []),
        });
      },
    });
  }

  private populateForm(lineup: any, subs: any[]) {
    this.form.patchValue({
      serviceType: lineup.serviceType,
      customServiceName: lineup.customServiceName || '',
      notes: lineup.notes || '',
      rehearsalDate: lineup.rehearsalDate || '',
      overallTheme: lineup.overallTheme || '',
      rehearsalTime: lineup.rehearsalTime || '',
    });

    // Build a map of accepted subs: memberId -> substituteUser
    const acceptedSubMap = new Map<string, any>();
    for (const s of subs) {
      if (s.status === 'ACCEPTED' && s.substituteUser && s.lineupMember?.id) {
        acceptedSubMap.set(s.lineupMember.id, s.substituteUser);
      }
    }

    // Populate dates
    lineup.dates.forEach((d: string) => {
      this.dates.push(this.fb.control(d, [Validators.required]));
    });

    // Populate members — use substitute user if accepted sub exists
    lineup.members.forEach((m: any) => {
      const subUser = acceptedSubMap.get(m.id);
      this.members.push(this.fb.group({
        userId: [subUser ? subUser.id : m.user.id, [Validators.required]],
        instrumentRoleId: [m.instrumentRole.id, [Validators.required]],
        customRoleName: [''],
      }));
    });

    // Populate songs (restore YouTube meta for songs with links)
    if (lineup.songs) {
      lineup.songs.forEach((s: any, i: number) => {
        this.songs.push(this.fb.group({
          title: [s.title, [Validators.required]],
          link: [s.link || ''],
          singerId: [s.singer?.id || ''],
        }));
        if (s.link && this.extractYoutubeId(s.link)) {
          this.http.get<{ title: string; thumbnail_url: string }>(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(s.link)}&format=json`,
          ).subscribe({
            next: (data) => {
              this.songYoutubeMeta[i] = { title: data.title, thumbnailUrl: data.thumbnail_url };
            },
            error: () => {},
          });
        }
      });
    }

    this.initialFormSnapshot = JSON.stringify(this.form.value);
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

  get hasChanges(): boolean {
    if (!this.isEditMode) return true;
    return JSON.stringify(this.form.value) !== this.initialFormSnapshot;
  }

  cancelEdit() {
    this.router.navigate(['/worship-lineups', this.lineupId]);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showServiceDatePicker = false;
    this.showRehearsalDatePicker = false;
  }

  toggleServiceDatePicker(event?: Event) {
    event?.stopPropagation();
    this.showServiceDatePicker = !this.showServiceDatePicker;
    this.showRehearsalDatePicker = false;
  }

  toggleRehearsalDatePicker(event?: Event) {
    event?.stopPropagation();
    this.showRehearsalDatePicker = !this.showRehearsalDatePicker;
    this.showServiceDatePicker = false;
  }

  private autoPopulateRehearsal() {
    if (this.form.get('serviceType')?.value !== 'SUNDAY_SERVICE') return;
    if (this.dates.length === 0) return;

    const earliest = this.dates.controls
      .map(c => c.value as string)
      .sort()[0];

    const dayBefore = this.getDayBefore(earliest);
    this.form.patchValue({ rehearsalDate: dayBefore, rehearsalTime: '10:00' });
  }

  private getDayBefore(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  get isSpecialEvent(): boolean {
    return this.form.get('serviceType')?.value === 'SPECIAL_EVENT';
  }

  onWebDateSelect(event: any) {
    const value = event.detail.value;
    if (!value) return;
    const dateStr = value.split('T')[0];
    const exists = this.dates.controls.some(c => c.value === dateStr);
    if (!exists) {
      this.dates.push(this.fb.control(dateStr, [Validators.required]));
      this.autoPopulateRehearsal();
    }
  }

  removeDate(index: number) {
    this.dates.removeAt(index);
    this.autoPopulateRehearsal();
  }

  onWebRehearsalDateSelect(event: any) {
    const value = event.detail.value;
    if (!value) return;
    this.form.patchValue({ rehearsalDate: value.split('T')[0] });
    this.showRehearsalDatePicker = false;
  }

  clearRehearsalDate() {
    this.form.patchValue({ rehearsalDate: '' });
  }

  onMobileDateAdd(dateStr: string) {
    if (!dateStr) return;
    const exists = this.dates.controls.some(c => c.value === dateStr);
    if (!exists) {
      this.dates.push(this.fb.control(dateStr, [Validators.required]));
      this.autoPopulateRehearsal();
    }
  }

  onMobileRehearsalDateSelect(dateStr: string) {
    if (dateStr) {
      this.form.patchValue({ rehearsalDate: dateStr });
    }
  }

  onRehearsalTimeChange(time: string) {
    this.form.patchValue({ rehearsalTime: time });
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

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Select date';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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

  // --- YouTube oEmbed ---

  extractYoutubeId(url: string): string | null {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    );
    return match ? match[1] : null;
  }

  generatePlaylistUrl(): string | null {
    const ids = this.songs.controls
      .map((_, i) => {
        const link = this.songs.at(i).get('link')?.value;
        return link ? this.extractYoutubeId(link) : null;
      })
      .filter(Boolean) as string[];
    return ids.length ? `https://www.youtube.com/watch_videos?video_ids=${ids.join(',')}` : null;
  }

  onYoutubeLinkInput(event: Event, index: number): void {
    const url = (event.target as HTMLInputElement).value?.trim();
    if (!url || !this.extractYoutubeId(url)) {
      this.songYoutubeMeta[index] = null;
      return;
    }
    if (this.songYoutubeMeta[index]) return; // already fetched for this URL

    this.isLoadingYoutube[index] = true;
    this.http.get<{ title: string; thumbnail_url: string }>(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    ).subscribe({
      next: (data) => {
        this.songYoutubeMeta[index] = { title: data.title, thumbnailUrl: data.thumbnail_url };
        this.songs.at(index).get('title')?.setValue(data.title);
        this.songs.at(index).get('link')?.setValue(url);
        this.isLoadingYoutube[index] = false;
      },
      error: () => { this.isLoadingYoutube[index] = false; },
    });
  }

  clearYoutubeLink(index: number): void {
    this.songYoutubeMeta[index] = null;
    this.songs.at(index).get('link')?.setValue('');
    this.songs.at(index).get('title')?.setValue('');
  }

  // --- Confirmation dialog ---

  getServiceTypeLabel(): string {
    const opt = this.serviceTypeOptions.find(o => o.value === this.form.get('serviceType')?.value);
    return opt?.label || '';
  }

  getMemberName(index: number): string {
    const userId = this.members.at(index)?.get('userId')?.value;
    const user = this.users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  getMemberRole(index: number): string {
    const roleId = this.members.at(index)?.get('instrumentRoleId')?.value;
    const role = this.instrumentRoles.find(r => r.id === roleId);
    return role?.name || '';
  }

  onSubmitClick(): void {
    if (this.form.invalid || this.dates.length === 0 || this.members.length === 0) return;
    this.showConfirmDialog = true;
  }

  onConfirmSubmit(): void {
    this.showConfirmDialog = false;
    this.onSubmit();
  }

  onCancelConfirm(): void {
    this.showConfirmDialog = false;
  }

  onSubmit() {
    if (this.form.invalid || this.dates.length === 0 || this.songs.length === 0 || this.members.length === 0) return;
    this.isLoading = true;

    const formValue = this.form.value;
    const payload: any = {
      dates: formValue.dates,
      serviceType: formValue.serviceType,
      notes: formValue.notes || undefined,
      rehearsalDate: formValue.rehearsalDate || undefined,
      overallTheme: formValue.overallTheme || undefined,
      rehearsalTime: formValue.rehearsalTime || undefined,
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

    const request$ = this.isEditMode
      ? this.lineupsService.update(this.lineupId!, payload)
      : this.lineupsService.create(payload);

    request$.subscribe({
      next: (savedLineup) => {
        this.isLoading = false;
        const msg = this.isEditMode ? 'Lineup updated' : 'Lineup submitted';
        this.toast.success(msg);
        this.router.navigate(['/worship-lineups', savedLineup.id], {
          state: { playlistUrl: savedLineup.playlistUrl || null, isNewSubmit: true },
        });
      },
      error: () => {
        this.isLoading = false;
        const msg = this.isEditMode ? 'Failed to update lineup' : 'Failed to create lineup';
        this.toast.error(msg);
      },
    });
  }
}
