import 'zone.js';
import '@angular/compiler';
import './index.css';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component.js';
import { routes } from './app/app.routes.js';
import { csrfInterceptor } from './app/core/interceptors/csrf.interceptor.js';
import { errorInterceptor } from './app/core/interceptors/error.interceptor.js';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([csrfInterceptor, errorInterceptor])),
  ],
}).catch((err) => console.error('Bootstrap failure:', err));
