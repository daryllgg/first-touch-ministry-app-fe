import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonBackButton, IonButtons, IonSpinner, IonSelect, IonSelectOption,
} from '@ionic/angular/standalone';
import { PledgesService } from '../../services/pledges.service';
import {
  GivingProgram, PledgeSummary, ComplianceData, CompliancePledgee, MonthlyTrend,
} from '../../interfaces/pledge.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-giving-analytics',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonBackButton, IonButtons, IonSpinner, IonSelect, IonSelectOption,
  ],
  templateUrl: './giving-analytics.page.html',
  styleUrls: ['./giving-analytics.page.scss'],
})
export class GivingAnalyticsPage implements OnInit {
  isWeb = environment.platform === 'web';
  selectedYear = new Date().getFullYear();
  yearOptions: number[] = [];

  summary: PledgeSummary | null = null;
  trends: MonthlyTrend[] = [];
  programs: GivingProgram[] = [];
  selectedProgramId = '';
  compliance: ComplianceData | null = null;
  isLoadingSummary = true;
  isLoadingTrends = true;
  isLoadingCompliance = false;

  monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  constructor(private pledgesService: PledgesService) {}

  ngOnInit() {
    const currentYear = new Date().getFullYear();
    this.yearOptions = [currentYear - 1, currentYear, currentYear + 1];
    this.loadSummary();
    this.loadTrends();
    this.loadPrograms();
  }

  onYearChange() {
    this.loadSummary();
    this.loadTrends();
  }

  loadSummary() {
    this.isLoadingSummary = true;
    this.pledgesService.getSummary(this.selectedYear).subscribe({
      next: (data) => {
        this.summary = data;
        this.isLoadingSummary = false;
      },
      error: () => this.isLoadingSummary = false,
    });
  }

  loadTrends() {
    this.isLoadingTrends = true;
    this.pledgesService.getTrends(this.selectedYear).subscribe({
      next: (data) => {
        this.trends = data;
        this.isLoadingTrends = false;
      },
      error: () => this.isLoadingTrends = false,
    });
  }

  loadPrograms() {
    this.pledgesService.getPrograms().subscribe({
      next: (data) => {
        this.programs = data.filter(p => p.type === 'FAITH_PLEDGE');
        if (this.programs.length > 0) {
          this.selectedProgramId = this.programs[0].id;
          this.loadCompliance();
        }
      },
    });
  }

  onProgramChange() {
    this.loadCompliance();
  }

  loadCompliance() {
    if (!this.selectedProgramId) return;
    this.isLoadingCompliance = true;
    this.pledgesService.getCompliance(this.selectedProgramId).subscribe({
      next: (data) => {
        this.compliance = data;
        this.isLoadingCompliance = false;
      },
      error: () => this.isLoadingCompliance = false,
    });
  }

  getMonthTotal(monthIndex: number): number {
    const monthStr = `${this.selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    return this.trends
      .filter(t => t.month === monthStr)
      .reduce((sum, t) => sum + parseFloat(t.total || '0'), 0);
  }

  getMaxMonthTotal(): number {
    let max = 0;
    for (let i = 0; i < 12; i++) {
      const total = this.getMonthTotal(i);
      if (total > max) max = total;
    }
    return max || 1;
  }

  getBarHeight(monthIndex: number): number {
    return (this.getMonthTotal(monthIndex) / this.getMaxMonthTotal()) * 100;
  }

  getOverduePledgees(): CompliancePledgee[] {
    return this.compliance?.pledgees.filter(p => p.status === 'BEHIND') || [];
  }

  getStatusLabel(status: string): string {
    switch (status) { case 'COMPLETE': return 'Complete'; case 'ON_TRACK': return 'On Track'; case 'BEHIND': return 'Behind'; case 'NEW': return 'New'; default: return status; }
  }

  getStatusClass(status: string): string {
    switch (status) { case 'COMPLETE': return 'status-complete'; case 'ON_TRACK': return 'status-ontrack'; case 'BEHIND': return 'status-behind'; default: return 'status-new'; }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  }
}
