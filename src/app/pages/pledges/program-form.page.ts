import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonBackButton, IonButtons, IonSpinner, IonDatetime,
} from '@ionic/angular/standalone';
import { PledgesService } from '../../services/pledges.service';
import { ToastService } from '../../components/toast/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-program-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonBackButton, IonButtons, IonSpinner, IonDatetime,
  ],
  templateUrl: './program-form.page.html',
  styleUrls: ['./program-form.page.scss'],
})
export class ProgramFormPage implements OnInit {
  isWeb = environment.platform === 'web';
  form: FormGroup;
  isLoading = false;
  programId: string | null = null;
  isEditMode = false;

  showStartDatePicker = false;
  showEndDatePicker = false;
  showConductedDatePicker = false;

  // Month checkboxes for FAITH_PLEDGE
  selectedYear = new Date().getFullYear();
  yearOptions: number[] = [];
  monthChecks: boolean[] = new Array(12).fill(false);
  monthLabels = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  typeOptions = [
    { value: 'SEED_FAITH', label: 'Seed Faith' },
    { value: 'FAITH_PLEDGE', label: 'Faith Pledge' },
    { value: 'CUSTOM', label: 'Custom' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private pledgesService: PledgesService,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      type: ['', [Validators.required]],
      description: [''],
      startDate: [''],
      endDate: [''],
      conductedDate: [''],
    });
  }

  ngOnInit() {
    const currentYear = new Date().getFullYear();
    this.yearOptions = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
    this.setDefaultMonthChecks();

    this.programId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.programId;
    if (this.isEditMode) {
      this.pledgesService.getProgram(this.programId!).subscribe({
        next: (program) => {
          this.form.patchValue({
            name: program.name,
            type: program.type,
            description: program.description || '',
            startDate: program.startDate || '',
            endDate: program.endDate || '',
            conductedDate: program.conductedDate || '',
          });
          if (program.type === 'FAITH_PLEDGE' && program.programMonths?.length) {
            this.selectedYear = parseInt(program.programMonths[0].split('-')[0]);
            this.monthChecks = Array(12).fill(false);
            program.programMonths.forEach(m => {
              const monthIndex = parseInt(m.split('-')[1]) - 1;
              if (monthIndex >= 0 && monthIndex < 12) this.monthChecks[monthIndex] = true;
            });
          }
        },
      });
    }
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showStartDatePicker = false;
    this.showEndDatePicker = false;
    this.showConductedDatePicker = false;
  }

  toggleDatePicker(picker: string, event: Event) {
    event.stopPropagation();
    const isOpen = picker === 'start' ? this.showStartDatePicker
      : picker === 'end' ? this.showEndDatePicker
      : this.showConductedDatePicker;
    this.showStartDatePicker = false;
    this.showEndDatePicker = false;
    this.showConductedDatePicker = false;
    if (!isOpen) {
      if (picker === 'start') this.showStartDatePicker = true;
      else if (picker === 'end') this.showEndDatePicker = true;
      else this.showConductedDatePicker = true;
    }
  }

  onDateChange(event: any, field: string) {
    const value = event.detail.value;
    if (value) {
      this.form.get(field)?.setValue(value.split('T')[0]);
    }
    this.showStartDatePicker = false;
    this.showEndDatePicker = false;
    this.showConductedDatePicker = false;
  }

  formatDisplayDate(value: string): string {
    if (!value) return '';
    const date = new Date(value + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // --- Month Checkboxes ---

  get isFaithPledge(): boolean {
    return this.form.get('type')?.value === 'FAITH_PLEDGE';
  }

  setDefaultMonthChecks() {
    this.monthChecks = this.monthChecks.map((_, i) => i >= 1 && i <= 10); // Feb–Nov
  }

  get selectedMonths(): string[] {
    return this.monthChecks
      .map((checked, i) => checked ? `${this.selectedYear}-${String(i + 1).padStart(2, '0')}` : null)
      .filter((m): m is string => m !== null);
  }

  get allMonthsChecked(): boolean {
    return this.monthChecks.every(c => c);
  }

  get someMonthsChecked(): boolean {
    return this.monthChecks.some(c => c) && !this.allMonthsChecked;
  }

  toggleAllMonths(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.monthChecks = this.monthChecks.map(() => checked);
  }

  formatMonthLabel(ym: string): string {
    const [year, month] = ym.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  get dateError(): string {
    const start = this.form.get('startDate')?.value;
    const end = this.form.get('endDate')?.value;
    if (start && end && end < start) return 'End date must be after start date';
    return '';
  }

  onSubmit() {
    if (this.form.invalid) return;
    if (!this.isFaithPledge && this.dateError) {
      this.toast.error(this.dateError);
      return;
    }
    if (this.isFaithPledge && this.selectedMonths.length === 0) {
      this.toast.error('Please select at least one month');
      return;
    }
    this.isLoading = true;
    const payload: any = { ...this.form.value };
    if (this.isFaithPledge) {
      payload.programMonths = this.selectedMonths;
      payload.startDate = null;
      payload.endDate = null;
    }

    const request$ = this.isEditMode
      ? this.pledgesService.updateProgram(this.programId!, payload)
      : this.pledgesService.createProgram(payload);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success(this.isEditMode ? 'Program updated' : 'Program created');
        this.router.navigate(['/pledges']);
      },
      error: () => {
        this.isLoading = false;
        this.toast.error(this.isEditMode ? 'Failed to update' : 'Failed to create');
      },
    });
  }
}
