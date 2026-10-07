import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RequestStatus = 'idle' | 'pending' | 'completed' | 'failed';

export interface RequestMetric {
  status: RequestStatus;
  durationMs: number | null;
  error?: string;
}

@Component({
  selector: 'app-delay-demo-panel',
  standalone: true,
  imports: [CommonModule],
  inputs: ['profileDelay', 'recordsDelay', 'profileMetric', 'recordsMetric'],
  outputs: ['profileDelayChange', 'recordsDelayChange', 'reloadProfile', 'reloadRecords', 'reloadBoth'],
  template: `
    <div class="surface-card p-4 sm:p-5 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
            <h2 class="text-sm font-semibold text-slate-900 tracking-tight">API Delay Demonstration Panel</h2>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Demonstrates non-blocking, decoupled asynchronous loading. Profile and records fetch independently.
          </p>
        </div>

        <button
          type="button"
          (click)="reloadBoth.emit()"
          [disabled]="profileMetric.status === 'pending' || recordsMetric.status === 'pending'"
          class="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Trigger Asynchronous Fetch
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
        <!-- Profile Delay Control -->
        <div class="bg-slate-50 border border-slate-200 rounded-md p-3 hover:border-slate-300 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-slate-800">Profile Request Delay (GET /api/users/me)</span>
            <!-- Status Badge -->
            <span
              class="text-[11px] font-mono px-2 py-0.5 rounded border"
              [ngClass]="getStatusBadgeClass(profileMetric.status)"
            >
              {{ profileMetric.status | uppercase }}
              <span *ngIf="profileMetric.durationMs !== null">({{ profileMetric.durationMs }}ms)</span>
            </span>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs text-slate-500 mr-1">Delay:</span>
            <button
              *ngFor="let option of delayOptions"
              type="button"
              (click)="profileDelayChange.emit(option)"
              class="px-2.5 py-1 text-xs font-medium rounded transition-colors"
              [class.bg-indigo-600]="profileDelay === option"
              [class.text-white]="profileDelay === option"
              [class.bg-white]="profileDelay !== option"
              [class.text-slate-700]="profileDelay !== option"
              [class.border]="profileDelay !== option"
              [class.border-slate-200]="profileDelay !== option"
            >
              {{ option }}ms
            </button>
            <button
              type="button"
              (click)="reloadProfile.emit()"
              [disabled]="profileMetric.status === 'pending'"
              class="ml-auto text-[11px] text-indigo-600 hover:text-indigo-800 font-medium underline cursor-pointer disabled:opacity-50"
            >
              Fetch Profile
            </button>
          </div>
        </div>

        <!-- Records Delay Control -->
        <div class="bg-slate-50 border border-slate-200 rounded-md p-3 hover:border-slate-300 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-slate-800">Records Request Delay (GET /api/records)</span>
            <!-- Status Badge -->
            <span
              class="text-[11px] font-mono px-2 py-0.5 rounded border"
              [ngClass]="getStatusBadgeClass(recordsMetric.status)"
            >
              {{ recordsMetric.status | uppercase }}
              <span *ngIf="recordsMetric.durationMs !== null">({{ recordsMetric.durationMs }}ms)</span>
            </span>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs text-slate-500 mr-1">Delay:</span>
            <button
              *ngFor="let option of delayOptions"
              type="button"
              (click)="recordsDelayChange.emit(option)"
              class="px-2.5 py-1 text-xs font-medium rounded transition-colors"
              [class.bg-indigo-600]="recordsDelay === option"
              [class.text-white]="recordsDelay === option"
              [class.bg-white]="recordsDelay !== option"
              [class.text-slate-700]="recordsDelay !== option"
              [class.border]="recordsDelay !== option"
              [class.border-slate-200]="recordsDelay !== option"
            >
              {{ option }}ms
            </button>
            <button
              type="button"
              (click)="reloadRecords.emit()"
              [disabled]="recordsMetric.status === 'pending'"
              class="ml-auto text-[11px] text-indigo-600 hover:text-indigo-800 font-medium underline cursor-pointer disabled:opacity-50"
            >
              Fetch Records
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DelayDemoPanelComponent {
  @Input() profileDelay: number = 0;
  @Input() recordsDelay: number = 1500;
  @Input() profileMetric: RequestMetric = { status: 'idle', durationMs: null };
  @Input() recordsMetric: RequestMetric = { status: 'idle', durationMs: null };

  @Output() profileDelayChange = new EventEmitter<number>();
  @Output() recordsDelayChange = new EventEmitter<number>();
  @Output() reloadProfile = new EventEmitter<void>();
  @Output() reloadRecords = new EventEmitter<void>();
  @Output() reloadBoth = new EventEmitter<void>();

  delayOptions = [0, 500, 1500, 3000];

  getStatusBadgeClass(status: RequestStatus): string {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse';
      case 'completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'failed':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  }
}
