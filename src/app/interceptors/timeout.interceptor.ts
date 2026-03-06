import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { ToastService } from '../components/toast/toast.service';
import { ModalService } from '../components/modal/modal.service';

const WARN_DELAY = 45_000;
const ERROR_DELAY = 90_000;

let activeSlowRequests = 0;
let warnShown = false;
let errorShown = false;

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const modal = inject(ModalService);

  let warnTimer: ReturnType<typeof setTimeout> | null = null;
  let errorTimer: ReturnType<typeof setTimeout> | null = null;

  warnTimer = setTimeout(() => {
    activeSlowRequests++;
    if (!warnShown) {
      warnShown = true;
      toast.warning('Apologies for the wait, our server is still working on it.', 10000);
    }
  }, WARN_DELAY);

  errorTimer = setTimeout(() => {
    if (!errorShown) {
      errorShown = true;
      modal.alert({
        title: 'Connection Issue',
        message: 'There might be a problem with the connection. Please try again later.',
      });
    }
  }, ERROR_DELAY);

  return next(req).pipe(
    finalize(() => {
      if (warnTimer) clearTimeout(warnTimer);
      if (errorTimer) clearTimeout(errorTimer);
      if (activeSlowRequests > 0) activeSlowRequests--;
      if (activeSlowRequests === 0) {
        warnShown = false;
        errorShown = false;
      }
    }),
  );
};
