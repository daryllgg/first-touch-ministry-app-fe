import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PinService {
  private apiUrl = `${environment.apiUrl}/user-pin`;
  private pinVerifiedSubject = new BehaviorSubject<boolean>(false);
  pinVerified$ = this.pinVerifiedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredVerification();
  }

  get isPinVerified(): boolean {
    return this.pinVerifiedSubject.value;
  }

  async loadStoredVerification(): Promise<void> {
    const { value } = await Preferences.get({ key: 'pinVerified' });
    if (value === 'true') {
      this.pinVerifiedSubject.next(true);
    }
  }

  checkHasPin(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/status`);
  }

  setupPin(pin: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/setup`, { pin }).pipe(
      tap((result) => {
        if (result.success) {
          this.pinVerifiedSubject.next(true);
          Preferences.set({ key: 'pinVerified', value: 'true' });
        }
      }),
    );
  }

  verifyPin(pin: string): Observable<{ verified: boolean }> {
    return this.http.post<{ verified: boolean }>(`${this.apiUrl}/verify`, { pin }).pipe(
      tap((result) => {
        if (result.verified) {
          this.pinVerifiedSubject.next(true);
          Preferences.set({ key: 'pinVerified', value: 'true' });
        }
      }),
    );
  }

  changePin(currentPin: string, newPin: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/change`, { currentPin, newPin });
  }

  clearVerification() {
    this.pinVerifiedSubject.next(false);
    Preferences.remove({ key: 'pinVerified' });
  }
}
