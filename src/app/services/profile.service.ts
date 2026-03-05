import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/profile`, data);
  }

  uploadProfilePicture(formData: FormData): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/profile/picture`, formData);
  }

  getPendingProfileChanges(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users/profile-changes/pending`);
  }

  approveProfileChange(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/profile-changes/${id}/approve`, {});
  }

  rejectProfileChange(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/profile-changes/${id}/reject`, {});
  }
}
