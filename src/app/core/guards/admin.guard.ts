import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service.js';
import { filter, map, take } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isInitializing$.pipe(
    filter((isInitializing) => !isInitializing),
    take(1),
    map(() => {
      if (authService.isAuthenticated && authService.isAdmin) {
        return true;
      }
      return router.createUrlTree(['/dashboard']);
    })
  );
};
