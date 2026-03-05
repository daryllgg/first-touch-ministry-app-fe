import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, LoginResponse } from '../interfaces/user.interface';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  private async loadStoredUser() {
    const { value: token } = await Preferences.get({ key: 'accessToken' });
    if (token) {
      this.getMe().subscribe({
        next: (user) => this.currentUserSubject.next(user),
        error: () => this.logout(),
      });
    }
  }

  getOtpStatus(email: string): Observable<{ status: 'none' | 'pending' | 'verified' }> {
    return this.http.post<{ status: 'none' | 'pending' | 'verified' }>(`${this.apiUrl}/auth/otp-status`, { email });
  }

  sendOtp(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/send-otp`, { email });
  }

  verifyOtp(email: string, otp: string): Observable<{ verified: boolean; email: string }> {
    return this.http.post<{ verified: boolean; email: string }>(`${this.apiUrl}/auth/verify-otp`, { email, otp });
  }

  register(data: Record<string, any>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, data);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(async (res) => {
          await Preferences.set({ key: 'accessToken', value: res.accessToken });
          this.currentUserSubject.next(res.user);
        }),
      );
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`);
  }

  async logout() {
    await Preferences.remove({ key: 'accessToken' });
    this.currentUserSubject.next(null);
  }

  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'accessToken' });
    return value;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(roleName: string): boolean {
    return this.currentUser?.roles?.some((r) => r.name === roleName) ?? false;
  }

  refreshCurrentUser(): void {
    this.getMe().subscribe({
      next: (user) => this.currentUserSubject.next(user),
    });
  }
}
