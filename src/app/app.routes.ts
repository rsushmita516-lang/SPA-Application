import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component.js';
import { RegisterComponent } from './features/register/register.component.js';
import { DashboardComponent } from './features/dashboard/dashboard.component.js';
import { UserManagementComponent } from './features/user-management/user-management.component.js';
import { AppLayoutComponent } from './layout/app-layout.component.js';
import { authGuard } from './core/guards/auth.guard.js';
import { adminGuard } from './core/guards/admin.guard.js';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'users',
        component: UserManagementComponent,
        canActivate: [adminGuard],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
