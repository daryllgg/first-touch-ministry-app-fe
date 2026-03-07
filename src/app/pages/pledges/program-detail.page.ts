import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonBackButton, IonButtons, IonIcon, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline, createOutline } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { PledgesService } from '../../services/pledges.service';
import { ModalService } from '../../components/modal/modal.service';
import { ToastService } from '../../components/toast/toast.service';
import { Pledge, GivingProgram } from '../../interfaces/pledge.interface';
import { User } from '../../interfaces/user.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-program-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonBackButton, IonButtons, IonIcon, IonSpinner,
  ],
  templateUrl: './program-detail.page.html',
  styleUrls: ['./program-detail.page.scss'],
})
export class ProgramDetailPage implements OnInit {
  isWeb = environment.platform === 'web';
  program: GivingProgram | null = null;
  pledges: Pledge[] = [];
  users: User[] = [];
  isLoading = true;
  expandedPledgeId: string | null = null;

  // Inline Add Pledgee form
  showAddForm = false;
  addForm = {
    userId: '',
    pledgeAmount: '',
    totalMonths: '10',
    startMonth: '',
    notes: '',
    defaultAmount: '',
  };
  monthlyAmountInputs: Record<string, string> = {};
  isAddingPledgee = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private pledgesService: PledgesService,
    private modal: ModalService,
    private toast: ToastService,
  ) {
    addIcons({ addOutline, trashOutline, createOutline });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadProgram(id);
    this.loadPledges(id);
    this.loadUsers();
  }

  async deleteProgram() {
    if (!this.program) return;
    const confirmed = await this.modal.confirm({
      title: 'Delete Program',
      message: `Are you sure you want to delete "${this.program.name}"? All pledgees and their payment records will also be permanently deleted.`,
      confirmColor: 'danger',
    });
    if (!confirmed) return;
    this.pledgesService.deleteProgram(this.program.id).subscribe({
      next: () => {
        this.toast.success('Program deleted');
        this.router.navigate(['/pledges']);
      },
      error: () => this.toast.error('Failed to delete program'),
    });
  }

  loadProgram(id: string) {
    this.pledgesService.getProgram(id).subscribe({
      next: (data) => this.program = data,
    });
  }

  loadPledges(id: string) {
    this.isLoading = true;
    this.pledgesService.getPledgesByProgram(id).subscribe({
      next: (data) => {
        this.pledges = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false,
    });
  }

  loadUsers() {
    const roles = 'NORMAL_USER,PASTOR,LEADER,OUTREACH_WORKER,ADMIN,SUPER_ADMIN,WORSHIP_LEADER,WORSHIP_TEAM_HEAD,GUITARIST,KEYBOARDIST,DRUMMER,BASSIST,SINGER';
    this.http.get<User[]>(`${environment.apiUrl}/users/by-roles?roles=${roles}`).subscribe({
      next: (data) => this.users = data,
    });
  }

  getTotalPaid(pledge: Pledge): number {
    return pledge.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  }

  getBalance(pledge: Pledge): number {
    return this.getTotalAmount(pledge) - this.getTotalPaid(pledge);
  }

  getStatus(pledge: Pledge): string {
    const balance = this.getBalance(pledge);
    if (balance <= 0) return 'COMPLETE';
    if (this.program?.type !== 'FAITH_PLEDGE') return pledge.payments.length > 0 ? 'PARTIAL' : 'NEW';

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthsPaid = pledge.payments.length;

    if (pledge.monthlyAmounts) {
      const months = Object.keys(pledge.monthlyAmounts).sort();
      if (monthsPaid >= months.length) return 'COMPLETE';
      const monthsDue = months.filter(m => m <= currentMonth).length;
      return monthsPaid >= monthsDue ? 'ON_TRACK' : 'BEHIND';
    }

    // Legacy
    const totalMonths = pledge.totalMonths || 10;
    if (monthsPaid >= totalMonths) return 'COMPLETE';
    let monthsDue = 0;
    if (pledge.startMonth) {
      const start = new Date(pledge.startMonth + '-01');
      const end = new Date(currentMonth + '-01');
      monthsDue = Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);
      monthsDue = Math.min(monthsDue, totalMonths);
    }
    return monthsPaid >= monthsDue ? 'ON_TRACK' : 'BEHIND';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETE': return 'Complete';
      case 'ON_TRACK': return 'On Track';
      case 'BEHIND': return 'Behind';
      case 'PARTIAL': return 'Partial';
      case 'NEW': return 'New';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETE': return 'status-complete';
      case 'ON_TRACK': return 'status-ontrack';
      case 'BEHIND': return 'status-behind';
      default: return 'status-new';
    }
  }

  toggleExpand(pledgeId: string) {
    this.expandedPledgeId = this.expandedPledgeId === pledgeId ? null : pledgeId;
  }

  // --- Inline Add Pledgee ---

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
    const defaultAmt = this.addForm.defaultAmount;
    for (const month of Object.keys(this.monthlyAmountInputs)) {
      this.monthlyAmountInputs[month] = defaultAmt;
    }
  }

  get monthlyAmountsTotal(): number {
    return Object.values(this.monthlyAmountInputs)
      .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }

  get addFormEndMonth(): string {
    if (!this.addForm.startMonth || !this.addForm.totalMonths) return '';
    const [year, month] = this.addForm.startMonth.split('-').map(Number);
    if (!year || !month) return '';
    const total = parseInt(this.addForm.totalMonths) || 10;
    const endMonthIndex = month - 1 + total - 1;
    const endYear = year + Math.floor(endMonthIndex / 12);
    const endMonth = (endMonthIndex % 12) + 1;
    return `${endYear}-${String(endMonth).padStart(2, '0')}`;
  }

  get addFormTotalAmount(): number {
    const amount = parseFloat(this.addForm.pledgeAmount) || 0;
    if (this.isFaithPledge) {
      const months = parseInt(this.addForm.totalMonths) || 10;
      return amount * months;
    }
    return amount;
  }

  openAddForm() {
    const year = new Date().getFullYear();
    this.addForm = {
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
    this.showAddForm = true;
  }

  cancelAddForm() {
    this.showAddForm = false;
  }

  submitAddPledgee() {
    if (!this.addForm.userId) {
      this.toast.error('Please select a member');
      return;
    }

    const onSuccess = () => {
      this.toast.success('Pledgee added');
      this.showAddForm = false;
      this.isAddingPledgee = false;
      this.loadPledges(this.program!.id);
    };
    const onError = () => {
      this.toast.error('Failed to add pledgee');
      this.isAddingPledgee = false;
    };

    if (this.isFaithPledge && this.hasProgramMonths) {
      // Per-month flow
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
      this.isAddingPledgee = true;
      const months = Object.keys(monthlyAmounts).sort();
      this.pledgesService.createPledge({
        userId: this.addForm.userId,
        programId: this.program!.id,
        pledgeAmount: 0,
        monthlyAmounts,
        totalMonths: months.length,
        startMonth: months[0],
        notes: this.addForm.notes || undefined,
      }).subscribe({ next: onSuccess, error: onError });
    } else {
      // Legacy flow
      if (!this.addForm.pledgeAmount) {
        this.toast.error('Please fill in required fields');
        return;
      }
      this.isAddingPledgee = true;
      this.pledgesService.createPledge({
        userId: this.addForm.userId,
        programId: this.program!.id,
        pledgeAmount: parseFloat(this.addForm.pledgeAmount),
        totalMonths: this.isFaithPledge ? (parseInt(this.addForm.totalMonths) || 10) : undefined,
        startMonth: this.isFaithPledge ? (this.addForm.startMonth || undefined) : undefined,
        notes: this.addForm.notes || undefined,
      }).subscribe({ next: onSuccess, error: onError });
    }
  }

  // --- Mobile Add Pledgee (modal-based) ---

  async addPledgeeMobile() {
    if (this.isFaithPledge && this.hasProgramMonths) {
      this.openAddForm();
      return;
    }
    const userOptions = this.availableUsers.map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }));
    if (userOptions.length === 0) {
      this.toast.error('No available members to add');
      return;
    }
    const inputs: any[] = [
      { key: 'userId', label: 'Member', type: 'select', options: userOptions, required: true },
      { key: 'pledgeAmount', label: this.isFaithPledge ? 'Monthly Amount' : 'Amount', type: 'text', required: true },
    ];
    if (this.isFaithPledge) {
      inputs.push({ key: 'totalMonths', label: 'Total Months', type: 'text', value: '10' });
      inputs.push({ key: 'startMonth', label: 'Start Month (YYYY-MM)', type: 'text', value: `${new Date().getFullYear()}-02` });
    }
    inputs.push({ key: 'notes', label: 'Notes', type: 'textarea' });

    const result = await this.modal.prompt({ title: 'Add Pledgee', inputs });
    if (!result) return;
    this.pledgesService.createPledge({
      userId: result['userId'],
      programId: this.program!.id,
      pledgeAmount: parseFloat(result['pledgeAmount']),
      totalMonths: this.isFaithPledge ? (parseInt(result['totalMonths']) || 10) : undefined,
      startMonth: this.isFaithPledge ? (result['startMonth'] || undefined) : undefined,
      notes: result['notes'] || undefined,
    }).subscribe({
      next: () => {
        this.toast.success('Pledgee added');
        this.loadPledges(this.program!.id);
      },
      error: () => this.toast.error('Failed to add pledgee'),
    });
  }

  // --- Record Payment ---

  getMonthOptions(pledge: Pledge): { value: string; label: string }[] {
    if (pledge.monthlyAmounts) {
      return Object.keys(pledge.monthlyAmounts).sort().map(val => {
        const [y, m] = val.split('-').map(Number);
        const label = new Date(y, m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return { value: val, label };
      });
    }
    // Legacy
    if (!pledge.startMonth || !pledge.totalMonths) return [];
    const [startYear, startMonth] = pledge.startMonth.split('-').map(Number);
    const options: { value: string; label: string }[] = [];
    for (let i = 0; i < pledge.totalMonths; i++) {
      const mIndex = startMonth - 1 + i;
      const y = startYear + Math.floor(mIndex / 12);
      const m = (mIndex % 12) + 1;
      const val = `${y}-${String(m).padStart(2, '0')}`;
      const label = new Date(y, m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value: val, label });
    }
    return options;
  }

  async recordPayment(pledge: Pledge) {
    const isFP = this.program?.type === 'FAITH_PLEDGE';
    const monthOptions = isFP ? this.getMonthOptions(pledge) : [];

    let defaultAmount = String(pledge.pledgeAmount);
    let defaultMonth = '';
    if (pledge.monthlyAmounts && monthOptions.length > 0) {
      const paidMonths = new Set(pledge.payments.map(p => p.month).filter(Boolean));
      const unpaidMonth = Object.keys(pledge.monthlyAmounts).sort().find(m => !paidMonths.has(m));
      if (unpaidMonth) {
        defaultAmount = String(pledge.monthlyAmounts[unpaidMonth]);
        defaultMonth = unpaidMonth;
      }
    }
    if (!defaultMonth && monthOptions.length > 0) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const match = monthOptions.find(o => o.value === currentMonth);
      defaultMonth = match ? match.value : monthOptions[0].value;
    }

    const result = await this.modal.prompt({
      title: 'Record Payment',
      inputs: [
        { key: 'amount', label: 'Amount', type: 'text', required: true, value: defaultAmount },
        { key: 'date', label: 'Date (YYYY-MM-DD)', type: 'text', required: true, value: new Date().toISOString().split('T')[0] },
        ...(isFP && monthOptions.length > 0 ? [
          { key: 'month', label: 'For Month', type: 'select' as const, options: monthOptions, required: true, value: defaultMonth },
        ] : []),
        { key: 'paymentMethod', label: 'Payment Method', type: 'select' as const, options: [
          { value: 'CASH', label: 'Cash' },
          { value: 'GCASH', label: 'GCash' },
          { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
          { value: 'CHECK', label: 'Check' },
          { value: 'OTHER', label: 'Other' },
        ], required: true, value: 'CASH' },
        { key: 'referenceNumber', label: 'Reference / Transaction No.', type: 'text' as const,
          visibleWhen: { key: 'paymentMethod', values: ['GCASH', 'BANK_TRANSFER', 'CHECK'] },
        },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ],
    });

    if (!result) return;
    this.pledgesService.createPayment(pledge.id, {
      amount: parseFloat(result['amount']),
      date: result['date'],
      month: result['month'] || undefined,
      paymentMethod: result['paymentMethod'],
      referenceNumber: result['referenceNumber'] || undefined,
      notes: result['notes'] || undefined,
    }).subscribe({
      next: () => {
        this.toast.success('Payment recorded');
        this.loadPledges(this.program!.id);
      },
      error: () => this.toast.error('Failed to record payment'),
    });
  }

  async deletePledge(pledge: Pledge) {
    const confirmed = await this.modal.confirm({
      title: 'Delete Pledge',
      message: `Remove ${pledge.user.firstName} ${pledge.user.lastName} from this program? All their payment records will also be deleted.`,
      confirmColor: 'danger',
    });
    if (!confirmed) return;
    this.pledgesService.deletePledge(pledge.id).subscribe({
      next: () => {
        this.toast.success('Pledge removed');
        this.loadPledges(this.program!.id);
      },
      error: () => this.toast.error('Failed to remove pledge'),
    });
  }

  async deletePayment(paymentId: string) {
    const confirmed = await this.modal.confirm({ title: 'Delete Payment', message: 'Are you sure you want to delete this payment?', confirmColor: 'danger' });
    if (!confirmed) return;
    this.pledgesService.deletePayment(paymentId).subscribe({
      next: () => {
        this.toast.success('Payment deleted');
        this.loadPledges(this.program!.id);
      },
      error: () => this.toast.error('Failed to delete payment'),
    });
  }

  getEndMonth(pledge: Pledge): string {
    if (!pledge.startMonth || !pledge.totalMonths) return '—';
    const [year, month] = pledge.startMonth.split('-').map(Number);
    const endMonthIndex = month - 1 + pledge.totalMonths - 1;
    const endYear = year + Math.floor(endMonthIndex / 12);
    const endMonth = (endMonthIndex % 12) + 1;
    return `${endYear}-${String(endMonth).padStart(2, '0')}`;
  }

  formatMonth(ym: string): string {
    if (!ym || ym === '—') return '—';
    const [year, month] = ym.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  getTotalAmount(pledge: Pledge): number {
    if (pledge.monthlyAmounts) {
      return Object.values(pledge.monthlyAmounts).reduce((sum, v) => sum + Number(v), 0);
    }
    if (this.program?.type === 'FAITH_PLEDGE') {
      return Number(pledge.pledgeAmount) * (pledge.totalMonths || 10);
    }
    return Number(pledge.pledgeAmount);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getProgramTypeBadge(type: string): string {
    switch (type) { case 'SEED_FAITH': return 'Seed Faith'; case 'FAITH_PLEDGE': return 'Faith Pledge'; case 'CUSTOM': return 'Custom'; default: return type; }
  }

  getProgramTypeClass(type: string): string {
    switch (type) { case 'SEED_FAITH': return 'badge-seed'; case 'FAITH_PLEDGE': return 'badge-faith'; case 'CUSTOM': return 'badge-custom'; default: return ''; }
  }
}
