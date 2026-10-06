import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service.js';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getCsrfToken();

  const isMutating = ['POST', 'PATCH', 'DELETE', 'PUT'].includes(req.method);

  let headers = req.headers;
  if (isMutating && token) {
    headers = headers.set('x-csrf-token', token);
  }

  const modifiedReq = req.clone({
    headers,
    withCredentials: true,
  });

  return next(modifiedReq);
};
