import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = await authService.getToken();
  if (token) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
