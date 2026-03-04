import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Announcement } from '../interfaces/announcement.interface';

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
  private apiUrl = `${environment.apiUrl}/announcements`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(this.apiUrl);
  }

  findOne(id: string): Observable<Announcement> {
    return this.http.get<Announcement>(`${this.apiUrl}/${id}`);
  }

  create(data: { title: string; content: string }): Observable<Announcement> {
    return this.http.post<Announcement>(this.apiUrl, data);
  }

  update(id: string, data: Partial<{ title: string; content: string }>): Observable<Announcement> {
    return this.http.patch<Announcement>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
