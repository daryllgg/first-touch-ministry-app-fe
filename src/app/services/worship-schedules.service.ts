import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WorshipSchedule } from '../interfaces/worship-schedule.interface';

@Injectable({ providedIn: 'root' })
export class WorshipSchedulesService {
  private apiUrl = `${environment.apiUrl}/worship-schedules`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<WorshipSchedule[]> {
    return this.http.get<WorshipSchedule[]>(this.apiUrl);
  }

  findUpcoming(): Observable<WorshipSchedule[]> {
    return this.http.get<WorshipSchedule[]>(`${this.apiUrl}/upcoming`);
  }

  create(data: { title: string; description?: string; scheduledDate: string }): Observable<WorshipSchedule> {
    return this.http.post<WorshipSchedule>(this.apiUrl, data);
  }

  update(id: string, data: Partial<{ title: string; description: string; scheduledDate: string }>): Observable<WorshipSchedule> {
    return this.http.patch<WorshipSchedule>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
