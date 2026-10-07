import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service.js';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  inputs: ['isOpen'],
  outputs: ['closeSidebar'],
  template: `
    <!-- Mobile Backdrop -->
    <div
      *ngIf="isOpen"
      (click)="closeSidebar.emit()"
      class="fixed inset-0 bg-slate-950/60 z-30 md:hidden backdrop-blur-xs transition-opacity"
    ></div>

    <!-- Sidebar Container (Dark Sidebar) -->
    <aside
      class="app-sidebar fixed top-0 bottom-0 left-0 w-64 text-slate-300 z-40 flex flex-col border-r transition-transform duration-200 ease-in-out md:translate-x-0"
      [class.translate-x-0]="isOpen"
      [class.-translate-x-full]="!isOpen"
    >
      <!-- Brand Header -->
      <div class="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-slate-950/20">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
            AP
          </div>
          <div class="leading-tight">
            <span class="font-semibold text-white text-sm tracking-tight">Access Portal</span>
            <span class="block text-[10px] text-slate-400 font-mono">ENTERPRISE SEC-V2</span>
          </div>
        </div>

        <button
          type="button"
          (click)="closeSidebar.emit()"
          class="md:hidden text-slate-400 hover:text-white p-1 rounded"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div class="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Workspace Navigation
        </div>

        <a
          routerLink="/dashboard"
          routerLinkActive="bg-blue-500/15 text-blue-300 border-l-2 border-blue-400 font-medium"
          (click)="closeSidebar.emit()"
          class="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <svg class="w-4 h-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Dashboard</span>
        </a>

        <!-- User Management Link: ONLY visible to Admins -->
        <a
          *ngIf="authService.isAdmin"
          routerLink="/users"
          routerLinkActive="bg-blue-500/15 text-blue-300 border-l-2 border-blue-400 font-medium"
          (click)="closeSidebar.emit()"
          class="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <svg class="w-4 h-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <div class="flex items-center justify-between w-full">
            <span>User Management</span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 uppercase">
              Admin
            </span>
          </div>
        </a>

        <!-- Informational note for General Users -->
        <div *ngIf="!authService.isAdmin" class="mt-4 px-3 py-2.5 rounded bg-slate-900/80 border border-slate-800/60 text-xs text-slate-400">
          <div class="font-medium text-slate-300 mb-0.5">Role: General User</div>
          <p class="text-[11px] leading-relaxed text-slate-400">
            Records are scoped strictly to your owner account. Admin management routes are restricted.
          </p>
        </div>
      </nav>

      <!-- Account Details & Logout Footer -->
      <div class="p-4 border-t border-slate-800/80 bg-slate-950/70" *ngIf="authService.currentUser$ | async as user">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2.5 truncate">
            <div class="w-7 h-7 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center text-xs font-semibold shrink-0">
              {{ user.name.charAt(0) }}
            </div>
            <div class="truncate text-left">
              <div class="text-xs font-medium text-white truncate">{{ user.name }}</div>
              <div class="text-[11px] text-slate-400 truncate">{{ user.email }}</div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-800/50">
          <span class="text-[10px] font-mono text-slate-400">ID: {{ user.userId }}</span>
          <button
            type="button"
            (click)="onLogout()"
            class="text-[11px] font-medium text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  public authService = inject(AuthService);
  private router = inject(Router);

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.closeSidebar.emit();
      this.router.navigate(['/login']);
    });
  }
}
