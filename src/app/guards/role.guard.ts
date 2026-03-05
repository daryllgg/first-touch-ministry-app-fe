import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export function roleGuard(...roles: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.getMe().pipe(
      map((user) => {
        const hasRole = user.roles?.some((r) => roles.includes(r.name));
        if (!hasRole) {
          router.navigate(['/home']);
          return false;
        }
        return true;
      }),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      }),
    );
  };
}
