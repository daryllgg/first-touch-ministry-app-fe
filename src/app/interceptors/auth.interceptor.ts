import { HttpInterceptorFn } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip auth headers for external requests (e.g. YouTube oEmbed)
  if (!req.url.startsWith(environment.apiUrl) && !req.url.startsWith('/')) {
    return next(req);
  }
  return from(Preferences.get({ key: 'accessToken' })).pipe(
    switchMap(({ value: token }) => {
      if (token) {
        const cloned = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
        return next(cloned);
      }
      return next(req);
    }),
  );
};
