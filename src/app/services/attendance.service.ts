import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  create(dto: any): Observable<any> {
    return this.http.post(this.apiUrl, dto);
  }

  findAll(params?: any): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  findByYouthProfile(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/youth-profile/${id}`);
  }
}
