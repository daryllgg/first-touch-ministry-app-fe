import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const approvedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getMe().pipe(
    map((user) => {
      if (user.isApproved) {
        return true;
      }
      router.navigate(['/pending']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    }),
  );
};
