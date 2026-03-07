import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonBackButton, IonButtons, IonSpinner, IonDatetime, IonModal,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { PledgesService } from '../../services/pledges.service';
import { ToastService } from '../../components/toast/toast.service';
import { GivingProgram, Pledge } from '../../interfaces/pledge.interface';
import { User } from '../../interfaces/user.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-pledgee',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonBackButton, IonButtons, IonSpinner, IonDatetime, IonModal,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/pledges/programs/' + programId"></ion-back-button>
        </ion-buttons>
        <ion-title>Add Pledgee</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (isLoading) {
        <div style="display:flex;justify-content:center;padding:40px">
          <ion-spinner></ion-spinner>
        </div>
      } @else {
        <div class="form-card">
          <div class="field">
            <label class="field-label">Member <span class="req">*</span></label>
            <select class="field-input" [(ngModel)]="form.userId">
              <option value="" disabled>Select member</option>
              @for (user of availableUsers; track user.id) {
                <option [value]="user.id">{{ user.firstName }} {{ user.lastName }}</option>
              }
            </select>
          </div>

          @if (isFaithPledge && hasProgramMonths) {
            <div class="field">
              <label class="field-label">Default Amount</label>
              <input type="number" class="field-input" [(ngModel)]="form.defaultAmount" (ngModelChange)="onDefaultAmountChange()" placeholder="Pre-fill all months" />
              <span class="field-hint">Sets the same amount for all months</span>
            </div>

            <div class="field">
              <label class="field-label">Monthly Amounts <span class="req">*</span></label>
              <div class="months-table">
                <div class="months-header">
                  <span>Month</span><span>Amount</span>
                </div>
                @for (month of sortedProgramMonths; track month) {
                  <div class="months-row">
                    <span class="month-label">{{ formatMonth(month) }}</span>
                    <input type="number" class="month-input" [(ngModel)]="monthlyAmountInputs[month]" placeholder="0.00" />
                  </div>
                }
                <div class="months-total">
                  <span>Total</span>
                  <span class="total-value">{{ formatCurrency(monthlyAmountsTotal) }}</span>
                </div>
              </div>
            </div>
          } @else if (isFaithPledge) {
            <div class="field">
              <label class="field-label">Monthly Amount <span class="req">*</span></label>
              <input type="number" class="field-input" [(ngModel)]="form.pledgeAmount" placeholder="0.00" />
            </div>
            <div class="field">
              <label class="field-label">Total Months</label>
              <input type="number" class="field-input" [(ngModel)]="form.totalMonths" />
            </div>
            <div class="field">
              <label class="field-label">Start Month</label>
              <button type="button" class="field-input month-picker-btn" (click)="showMonthPicker = true">
                {{ form.startMonth ? formatMonth(form.startMonth) : 'Select start month' }}
              </button>
              <ion-modal [isOpen]="showMonthPicker" (didDismiss)="showMonthPicker = false" [breakpoints]="[0, 0.5]" [initialBreakpoint]="0.5">
                <ng-template>
                  <ion-content>
                    <div style="padding:16px">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                        <span style="font-weight:600;color:#1e293b">Select Month</span>
                        <ion-button fill="clear" (click)="showMonthPicker = false">Done</ion-button>
                      </div>
                      <ion-datetime
                        presentation="month-year"
                        [value]="form.startMonth ? form.startMonth + '-01' : ''"
                        (ionChange)="onStartMonthSelect($event)"
                      ></ion-datetime>
                    </div>
                  </ion-content>
                </ng-template>
              </ion-modal>
            </div>
          } @else {
            <div class="field">
              <label class="field-label">Amount <span class="req">*</span></label>
              <input type="number" class="field-input" [(ngModel)]="form.pledgeAmount" placeholder="0.00" />
            </div>
          }

          <div class="field">
            <label class="field-label">Notes</label>
            <textarea class="field-input field-textarea" [(ngModel)]="form.notes" rows="3" placeholder="Optional notes"></textarea>
          </div>

          <div style="height:80px"></div>
        </div>
      }

      <div class="sticky-submit-bar">
        <button class="sticky-submit-btn" (click)="submit()" [disabled]="isSubmitting">
          @if (isSubmitting) { Adding... } @else { Add Pledgee }
        </button>
      </div>
    </ion-content>
  `,
  styles: [`
    .form-card {
      max-width: 540px;
      margin: 0 auto;
    }

    .field {
      margin-bottom: 14px;
    }

    .field-label {
      display: block;
      font-size: 0.82rem;
      font-weight: 500;
      color: #475569;
      margin-bottom: 5px;
    }

    .req { color: #ef4444; }

    .field-input {
      width: 100%;
      padding: 10px 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: 'Inter', sans-serif;
      color: #1e293b;
      background: white;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }

    .field-input:focus {
      outline: none;
      border-color: #1a3a4a;
    }

    .field-textarea {
      resize: vertical;
      min-height: 60px;
    }

    .field-hint {
      display: block;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 4px;
    }

    .months-table {
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }

    .months-header {
      display: flex;
      justify-content: space-between;
      padding: 10px 14px;
      background: #f8fafc;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
    }

    .months-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 14px;
      border-top: 1px solid #f1f5f9;
    }

    .month-label {
      font-size: 0.85rem;
      color: #1e293b;
    }

    .month-input {
      width: 120px;
      padding: 7px 10px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.85rem;
      text-align: right;
      font-family: 'Inter', sans-serif;
      color: #1e293b;
      box-sizing: border-box;
    }

    .month-input:focus {
      outline: none;
      border-color: #1a3a4a;
    }

    .months-total {
      display: flex;
      justify-content: space-between;
      padding: 10px 14px;
      background: #f8fafc;
      border-top: 1.5px solid #e2e8f0;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .total-value {
      color: #1a3a4a;
    }

    .month-picker-btn {
      text-align: left;
      cursor: pointer;
      color: #1e293b;
      background: white;
    }

    .sticky-submit-bar {
      position: fixed;
      bottom: 64px;
      left: 0;
      right: 0;
      padding: 12px 16px;
      background: white;
      border-top: 1px solid #f1f5f9;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
      z-index: 100;
    }

    .sticky-submit-btn {
      width: 100%;
      padding: 13px;
      border-radius: 10px;
      background: #1a3a4a;
      color: white;
      font-size: 0.9rem;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      border: none;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .sticky-submit-btn:active {
      opacity: 0.8;
    }

    .sticky-submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
})
export class AddPledgeePage implements OnInit, ViewWillEnter {
  programId = '';
  program: GivingProgram | null = null;
  pledges: Pledge[] = [];
  users: User[] = [];
  isLoading = true;
  isSubmitting = false;
  showMonthPicker = false;

  form = {
    userId: '',
    pledgeAmount: '',
    totalMonths: '10',
    startMonth: '',
    notes: '',
    defaultAmount: '',
  };
  monthlyAmountInputs: Record<string, string> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private pledgesService: PledgesService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  private loadData() {
    this.programId = this.route.snapshot.paramMap.get('id')!;
    this.isLoading = true;

    this.pledgesService.getProgram(this.programId).subscribe({
      next: (program) => {
        this.program = program;
        const year = new Date().getFullYear();
        this.form = {
          userId: '',
          pledgeAmount: '',
          totalMonths: '10',
          startMonth: `${year}-02`,
          notes: '',
          defaultAmount: '',
        };
        if (this.isFaithPledge && this.hasProgramMonths) {
          this.initMonthlyAmountInputs();
        }
      },
    });

    this.pledgesService.getPledgesByProgram(this.programId).subscribe({
      next: (data) => this.pledges = data,
    });

    const roles = 'NORMAL_USER,PASTOR,LEADER,OUTREACH_WORKER,ADMIN,SUPER_ADMIN,WORSHIP_LEADER,WORSHIP_TEAM_HEAD,GUITARIST,KEYBOARDIST,DRUMMER,BASSIST,SINGER';
    this.http.get<User[]>(`${environment.apiUrl}/users/by-roles?roles=${roles}`).subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  get availableUsers(): User[] {
    return this.users.filter(u => !this.pledges.some(p => p.user.id === u.id));
  }

  get isFaithPledge(): boolean {
    return this.program?.type === 'FAITH_PLEDGE';
  }

  get hasProgramMonths(): boolean {
    return !!(this.program?.programMonths && this.program.programMonths.length > 0);
  }

  get sortedProgramMonths(): string[] {
    return this.program?.programMonths?.slice().sort() || [];
  }

  initMonthlyAmountInputs() {
    this.monthlyAmountInputs = {};
    if (this.program?.programMonths) {
      for (const month of this.program.programMonths.slice().sort()) {
        this.monthlyAmountInputs[month] = '';
      }
    }
  }

  onDefaultAmountChange() {
    const defaultAmt = this.form.defaultAmount;
    for (const month of Object.keys(this.monthlyAmountInputs)) {
      this.monthlyAmountInputs[month] = defaultAmt;
    }
  }

  get monthlyAmountsTotal(): number {
    return Object.values(this.monthlyAmountInputs)
      .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }

  onStartMonthSelect(event: any) {
    const value = event.detail.value;
    if (value) {
      // ion-datetime month-year returns YYYY-MM-DDTHH:mm:ss, extract YYYY-MM
      this.form.startMonth = value.substring(0, 7);
    }
  }

  formatMonth(ym: string): string {
    if (!ym) return '';
    const [year, month] = ym.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  }

  submit() {
    if (!this.form.userId) {
      this.toast.error('Please select a member');
      return;
    }

    const onSuccess = () => {
      this.toast.success('Pledgee added');
      this.isSubmitting = false;
      this.router.navigate(['/pledges/programs', this.programId]);
    };
    const onError = () => {
      this.toast.error('Failed to add pledgee');
      this.isSubmitting = false;
    };

    if (this.isFaithPledge && this.hasProgramMonths) {
      const monthlyAmounts: Record<string, number> = {};
      let hasAnyAmount = false;
      for (const [month, val] of Object.entries(this.monthlyAmountInputs)) {
        const amount = parseFloat(val) || 0;
        if (amount > 0) {
          monthlyAmounts[month] = amount;
          hasAnyAmount = true;
        }
      }
      if (!hasAnyAmount) {
        this.toast.error('Please enter at least one monthly amount');
        return;
      }
      this.isSubmitting = true;
      const months = Object.keys(monthlyAmounts).sort();
      this.pledgesService.createPledge({
        userId: this.form.userId,
        programId: this.programId,
        pledgeAmount: 0,
        monthlyAmounts,
        totalMonths: months.length,
        startMonth: months[0],
        notes: this.form.notes || undefined,
      }).subscribe({ next: onSuccess, error: onError });
    } else {
      if (!this.form.pledgeAmount) {
        this.toast.error('Please fill in required fields');
        return;
      }
      this.isSubmitting = true;
      this.pledgesService.createPledge({
        userId: this.form.userId,
        programId: this.programId,
        pledgeAmount: parseFloat(this.form.pledgeAmount),
        totalMonths: this.isFaithPledge ? (parseInt(this.form.totalMonths) || 10) : undefined,
        startMonth: this.isFaithPledge ? (this.form.startMonth || undefined) : undefined,
        notes: this.form.notes || undefined,
      }).subscribe({ next: onSuccess, error: onError });
    }
  }
}
