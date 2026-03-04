import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PrayerRequest } from '../interfaces/prayer-request.interface';

@Injectable({ providedIn: 'root' })
export class PrayerRequestsService {
  private apiUrl = `${environment.apiUrl}/prayer-requests`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<PrayerRequest[]> {
    return this.http.get<PrayerRequest[]>(this.apiUrl);
  }

  create(data: { content: string; visibility?: 'PUBLIC' | 'PRIVATE' }): Observable<PrayerRequest> {
    return this.http.post<PrayerRequest>(this.apiUrl, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
