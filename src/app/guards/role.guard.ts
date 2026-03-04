import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function roleGuard(...roles: string[]): CanActivateFn {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Wait for user to be loaded
    const user = authService.currentUser;
    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    const hasRole = user.roles.some((r) => roles.includes(r.name));
    if (!hasRole) {
      router.navigate(['/home']);
      return false;
    }
    return true;
  };
}
