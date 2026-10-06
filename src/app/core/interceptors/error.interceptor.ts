import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service.js';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 Unauthorized handling (skip if request was already /api/auth/login or /api/auth/session)
      if (error.status === 401 && !req.url.includes('/api/auth/login') && !req.url.includes('/api/auth/session')) {
        authService.logout().subscribe();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
