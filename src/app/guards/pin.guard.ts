import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PinService } from '../services/pin.service';

export const pinGuard: CanActivateFn = () => {
  const pinService = inject(PinService);
  const router = inject(Router);
  if (pinService.isPinVerified) return true;
  router.navigate(['/pledges']);
  return false;
};
