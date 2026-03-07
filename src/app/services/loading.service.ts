import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private activeRequests = 0;
  private slowTimer: ReturnType<typeof setTimeout> | null = null;

  isLoading$ = new BehaviorSubject<boolean>(false);
  isSlow$ = new BehaviorSubject<boolean>(false);

  show() {
    this.activeRequests++;
    this.isLoading$.next(true);
    if (!this.slowTimer) {
      this.slowTimer = setTimeout(() => {
        if (this.activeRequests > 0) {
          this.isSlow$.next(true);
        }
      }, 30_000);
    }
  }

  hide() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.activeRequests === 0) {
      this.isLoading$.next(false);
      this.isSlow$.next(false);
      if (this.slowTimer) {
        clearTimeout(this.slowTimer);
        this.slowTimer = null;
      }
    }
  }
}
