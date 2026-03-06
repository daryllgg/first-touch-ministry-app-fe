import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WorshipLineup, SubstitutionRequest, InstrumentRole } from '../interfaces/worship-lineup.interface';

@Injectable({ providedIn: 'root' })
export class WorshipLineupsService {
  private apiUrl = `${environment.apiUrl}/worship-lineups`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<WorshipLineup[]> {
    return this.http.get<WorshipLineup[]>(this.apiUrl);
  }

  findOne(id: string): Observable<WorshipLineup> {
    return this.http.get<WorshipLineup>(`${this.apiUrl}/${id}`);
  }

  create(data: {
    dates: string[];
    serviceType: string;
    customServiceName?: string;
    notes?: string;
    rehearsalDate?: string;
    overallTheme?: string;
    members: { userId: string; instrumentRoleId: string }[];
    songs?: { title: string; link?: string; singerId?: string }[];
  }): Observable<WorshipLineup> {
    return this.http.post<WorshipLineup>(this.apiUrl, data);
  }

  update(id: string, data: {
    dates: string[];
    serviceType: string;
    customServiceName?: string;
    notes?: string;
    rehearsalDate?: string;
    overallTheme?: string;
    members: { userId: string; instrumentRoleId: string; customRoleName?: string }[];
    songs?: { title: string; link?: string; singerId?: string }[];
  }): Observable<WorshipLineup> {
    return this.http.patch<WorshipLineup>(`${this.apiUrl}/${id}`, data);
  }

  updateStatus(id: string, status: 'APPROVED' | 'REJECTED', comment?: string): Observable<WorshipLineup> {
    return this.http.patch<WorshipLineup>(`${this.apiUrl}/${id}/status`, { status, comment });
  }

  requestChanges(id: string, comment: string): Observable<WorshipLineup> {
    return this.http.patch<WorshipLineup>(`${this.apiUrl}/${id}/request-changes`, { comment });
  }

  resubmit(id: string): Observable<WorshipLineup> {
    return this.http.patch<WorshipLineup>(`${this.apiUrl}/${id}/resubmit`, {});
  }

  getInstrumentRoles(): Observable<InstrumentRole[]> {
    return this.http.get<InstrumentRole[]>(`${this.apiUrl}/instrument-roles`);
  }

  createInstrumentRole(name: string): Observable<InstrumentRole> {
    return this.http.post<InstrumentRole>(`${this.apiUrl}/instrument-roles`, { name });
  }

  deleteInstrumentRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/instrument-roles/${id}`);
  }

  createSubstitutionRequest(data: {
    lineupMemberId: string;
    substituteUserId?: string;
    reason: string;
  }): Observable<SubstitutionRequest> {
    return this.http.post<SubstitutionRequest>(`${this.apiUrl}/substitutions`, data);
  }

  findSubstitutionRequests(lineupId: string): Observable<SubstitutionRequest[]> {
    return this.http.get<SubstitutionRequest[]>(`${this.apiUrl}/${lineupId}/substitutions`);
  }

  updateSubstitutionStatus(id: string, status: 'APPROVED' | 'REJECTED'): Observable<SubstitutionRequest> {
    return this.http.patch<SubstitutionRequest>(`${this.apiUrl}/substitutions/${id}/status`, { status });
  }

  acceptSubstitution(id: string): Observable<SubstitutionRequest> {
    return this.http.patch<SubstitutionRequest>(`${this.apiUrl}/substitutions/${id}/accept`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
