import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../shared/models/user.model.js';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component.js';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton.component.js';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, LoadingSkeletonComponent],
  inputs: ['user', 'isLoading', 'errorMessage'],
  outputs: ['retry'],
  template: `
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs mb-6 relative overflow-hidden">
      <!-- Loading Skeleton State -->
      <div *ngIf="isLoading" class="space-y-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-slate-200 rounded-full animate-pulse"></div>
          <div class="space-y-2 flex-1">
            <div class="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
            <div class="h-3 bg-slate-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
          <div *ngFor="let i of [1, 2, 3, 4]" class="space-y-1">
            <div class="h-3 bg-slate-200 rounded w-16 animate-pulse"></div>
            <div class="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
      </div>

      <!-- Error State with Retry -->
      <div *ngIf="!isLoading && errorMessage" class="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Failed to load user profile: {{ errorMessage }}</span>
          </div>
          <button
            type="button"
            (click)="retry.emit()"
            class="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 rounded font-medium transition-colors cursor-pointer"
          >
            Retry Profile
          </button>
        </div>
      </div>

      <!-- Loaded Profile State -->
      <div *ngIf="!isLoading && !errorMessage && user" class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {{ user.name.charAt(0) }}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-lg font-bold text-slate-900 tracking-tight">{{ user.name }}</h3>
                <span
                  class="text-[11px] font-semibold px-2 py-0.5 rounded border"
                  [class.bg-indigo-50]="user.role === 'Admin'"
                  [class.text-indigo-700]="user.role === 'Admin'"
                  [class.border-indigo-200]="user.role === 'Admin'"
                  [class.bg-slate-50]="user.role !== 'Admin'"
                  [class.text-slate-700]="user.role !== 'Admin'"
                  [class.border-slate-200]="user.role !== 'Admin'"
                >
                  {{ user.role }}
                </span>
                <app-status-badge [status]="user.status"></app-status-badge>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">{{ user.email }}</p>
            </div>
          </div>

          <div class="text-left sm:text-right">
            <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">User ID</span>
            <span class="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{{ user.userId }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span class="text-slate-400 block text-[11px] uppercase tracking-wider font-medium">Access Scope</span>
            <span class="text-slate-800 font-medium">
              {{ user.role === 'Admin' ? 'All Organization Records' : 'Scoped Owner Records' }}
            </span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px] uppercase tracking-wider font-medium">Account Status</span>
            <span class="text-slate-800 font-medium">{{ user.status }}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px] uppercase tracking-wider font-medium">Created</span>
            <span class="text-slate-800 font-medium">{{ (user.createdAt | date:'mediumDate') || 'Standard' }}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px] uppercase tracking-wider font-medium">Last Login</span>
            <span class="text-slate-800 font-medium">{{ (user.lastLoginAt | date:'short') || 'Active Session' }}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileCardComponent {
  @Input() user: User | null = null;
  @Input() isLoading: boolean = false;
  @Input() errorMessage: string = '';
  @Output() retry = new EventEmitter<void>();
}
