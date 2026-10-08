import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service.js';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  outputs: ['toggleSidebar'],
  template: `
    <header class="app-header h-16 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      <div class="flex items-center gap-3">
        <button
          type="button"
          (click)="toggleSidebar.emit()"
          class="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-500">Access Portal</span>
          <span class="text-slate-300">/</span>
          <span class="text-sm font-semibold text-slate-800">{{ currentPage }}</span>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- User Brief Pill -->
        <div *ngIf="authService.currentUser$ | async as user" class="hidden sm:flex items-center gap-3 pr-2 border-r border-slate-200">
          <div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs tracking-wide">
            {{ user.name.charAt(0) }}
          </div>
          <div class="text-left leading-tight">
            <div class="text-sm font-medium text-slate-900">{{ user.name }}</div>
            <div class="text-xs text-slate-500 flex items-center gap-1.5">
              <span>{{ user.userId }}</span>
              <span>·</span>
              <span class="font-medium" [class.text-indigo-600]="user.role === 'Admin'" [class.text-slate-600]="user.role !== 'Admin'">
                {{ user.role }}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          (click)="onLogout()"
          class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-md transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </header>
  `
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  public authService = inject(AuthService);
  private router = inject(Router);

  get currentPage(): string {
    return this.router.url.includes('/users') ? 'User Management' : 'Dashboard';
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
