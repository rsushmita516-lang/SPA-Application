import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './core/services/auth.service.js';
import { AppStartupService } from './core/services/app-startup.service.js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Startup Initializing Splash Screen -->
    <div
      *ngIf="authService.isInitializing$ | async"
      class="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-4 text-center text-white"
    >
      <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg mb-4 shadow-lg animate-pulse">
        AP
      </div>
      <h2 class="text-base font-semibold tracking-tight text-white">Initializing Access Portal...</h2>
      <p class="text-xs text-slate-400 mt-1">Restoring authenticated session state</p>
      <div class="w-32 h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
        <div class="w-full h-full bg-indigo-500 animate-pulse"></div>
      </div>
    </div>

    <!-- Main Router Outlet -->
    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit {
  public authService = inject(AuthService);
  private startupService = inject(AppStartupService);

  ngOnInit(): void {
    this.startupService.initializeApp();
  }
}
