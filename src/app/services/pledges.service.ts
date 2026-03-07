import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  GivingProgram, Pledge, PledgePayment,
  PledgeSummary, ComplianceData, MonthlyTrend,
} from '../interfaces/pledge.interface';

@Injectable({ providedIn: 'root' })
export class PledgesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Programs
  createProgram(dto: any): Observable<GivingProgram> {
    return this.http.post<GivingProgram>(`${this.apiUrl}/giving-programs`, dto);
  }

  getPrograms(): Observable<GivingProgram[]> {
    return this.http.get<GivingProgram[]>(`${this.apiUrl}/giving-programs`);
  }

  getActivePrograms(): Observable<GivingProgram[]> {
    return this.http.get<GivingProgram[]>(`${this.apiUrl}/giving-programs/active`);
  }

  getProgram(id: string): Observable<GivingProgram> {
    return this.http.get<GivingProgram>(`${this.apiUrl}/giving-programs/${id}`);
  }

  updateProgram(id: string, dto: any): Observable<GivingProgram> {
    return this.http.patch<GivingProgram>(`${this.apiUrl}/giving-programs/${id}`, dto);
  }

  deleteProgram(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/giving-programs/${id}`);
  }

  // Pledges
  createPledge(dto: any): Observable<Pledge> {
    return this.http.post<Pledge>(`${this.apiUrl}/pledges`, dto);
  }

  getPledgesByProgram(programId: string): Observable<Pledge[]> {
    return this.http.get<Pledge[]>(`${this.apiUrl}/pledges`, { params: { programId } });
  }

  getMyPledges(): Observable<Pledge[]> {
    return this.http.get<Pledge[]>(`${this.apiUrl}/pledges/my`);
  }

  getPledge(id: string): Observable<Pledge> {
    return this.http.get<Pledge>(`${this.apiUrl}/pledges/${id}`);
  }

  updatePledge(id: string, dto: any): Observable<Pledge> {
    return this.http.patch<Pledge>(`${this.apiUrl}/pledges/${id}`, dto);
  }

  deletePledge(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pledges/${id}`);
  }

  // Payments
  createPayment(pledgeId: string, dto: any): Observable<PledgePayment> {
    return this.http.post<PledgePayment>(`${this.apiUrl}/pledges/${pledgeId}/payments`, dto);
  }

  updatePayment(paymentId: string, dto: any): Observable<PledgePayment> {
    return this.http.patch<PledgePayment>(`${this.apiUrl}/pledges/payments/${paymentId}`, dto);
  }

  deletePayment(paymentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pledges/payments/${paymentId}`);
  }

  // Analytics
  getSummary(year?: number): Observable<PledgeSummary> {
    const params: Record<string, string> = {};
    if (year) params['year'] = year.toString();
    return this.http.get<PledgeSummary>(`${this.apiUrl}/giving-analytics/summary`, { params });
  }

  getTrends(year?: number): Observable<MonthlyTrend[]> {
    const params: Record<string, string> = {};
    if (year) params['year'] = year.toString();
    return this.http.get<MonthlyTrend[]>(`${this.apiUrl}/giving-analytics/trends`, { params });
  }

  getCompliance(programId: string): Observable<ComplianceData> {
    return this.http.get<ComplianceData>(`${this.apiUrl}/giving-analytics/compliance`, { params: { programId } });
  }

  getOverdue(programId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/giving-analytics/overdue`, { params: { programId } });
  }
}
