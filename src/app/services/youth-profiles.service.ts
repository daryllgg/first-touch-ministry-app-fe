import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { YouthProfile, Station } from '../interfaces/youth-profile.interface';

@Injectable({ providedIn: 'root' })
export class YouthProfilesService {
  private apiUrl = `${environment.apiUrl}/youth-profiles`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<YouthProfile[]> {
    return this.http.get<YouthProfile[]>(this.apiUrl);
  }

  findOne(id: string): Observable<YouthProfile> {
    return this.http.get<YouthProfile>(`${this.apiUrl}/${id}`);
  }

  create(formData: FormData): Observable<YouthProfile> {
    return this.http.post<YouthProfile>(this.apiUrl, formData);
  }

  update(id: string, formData: FormData): Observable<YouthProfile> {
    return this.http.patch<YouthProfile>(`${this.apiUrl}/${id}`, formData);
  }

  uploadPhoto(id: string, formData: FormData): Observable<YouthProfile> {
    return this.http.patch<YouthProfile>(`${this.apiUrl}/${id}/photo`, formData);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStations(): Observable<Station[]> {
    return this.http.get<Station[]>(`${this.apiUrl}/stations`);
  }

  createStation(name: string): Observable<Station> {
    return this.http.post<Station>(`${this.apiUrl}/stations`, { name });
  }

  deleteStation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/stations/${id}`);
  }
}
