import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { UserService } from '../../core/services/user.service.js';
import { RecordService } from '../../core/services/record.service.js';
import { AuthService } from '../../core/services/auth.service.js';
import { User } from '../../shared/models/user.model.js';
import { PortalRecord, RecordsResponse } from '../../shared/models/record.model.js';
import { DelayDemoPanelComponent, RequestMetric } from './delay-demo-panel.component.js';
import { ProfileCardComponent } from './profile-card.component.js';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component.js';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton.component.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DelayDemoPanelComponent,
    ProfileCardComponent,
    StatusBadgeComponent,
    LoadingSkeletonComponent,
    DatePipe,
  ],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Portal Dashboard</h1>
          <p class="text-xs text-slate-500 mt-1">
            Access-controlled records view with independent asynchronous data retrieval.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500">Current Scope:</span>
          <span
            class="text-xs font-semibold px-2.5 py-1 rounded border"
            [class.bg-indigo-50]="isAdmin"
            [class.text-indigo-700]="isAdmin"
            [class.border-indigo-200]="isAdmin"
            [class.bg-slate-100]="!isAdmin"
            [class.text-slate-700]="!isAdmin"
            [class.border-slate-200]="!isAdmin"
          >
            {{ isAdmin ? 'Admin — Global View' : 'General User — Scoped View' }}
          </span>
        </div>
      </div>

      <!-- 1. API Delay Demo Panel -->
      <app-delay-demo-panel
        [profileDelay]="profileDelay"
        [recordsDelay]="recordsDelay"
        [profileMetric]="profileMetric"
        [recordsMetric]="recordsMetric"
        (profileDelayChange)="onProfileDelayChange($event)"
        (recordsDelayChange)="onRecordsDelayChange($event)"
        (reloadProfile)="loadProfile()"
        (reloadRecords)="triggerRecordsLoad()"
        (reloadBoth)="reloadBoth()"
      ></app-delay-demo-panel>

      <!-- 2. Profile Card (Loads Independently) -->
      <app-profile-card
        [user]="profileUser"
        [isLoading]="profileMetric.status === 'pending'"
        [errorMessage]="profileErrorMessage"
        (retry)="loadProfile()"
      ></app-profile-card>

      <!-- 3. Records Table Card -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <!-- Records Header & Filter Toolbar -->
        <div class="p-4 sm:p-5 border-b border-slate-200 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-slate-900 tracking-tight">Access Records</h2>
                <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {{ totalRecords }} total
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ isAdmin ? 'Showing all organization records across all owners.' : 'Displaying records owned by your account.' }}
              </p>
            </div>

            <!-- Refresh Button -->
            <button
              type="button"
              (click)="triggerRecordsLoad()"
              [disabled]="recordsMetric.status === 'pending'"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg class="w-3.5 h-3.5" [class.animate-spin]="recordsMetric.status === 'pending'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>

          <!-- Search and Status Filters -->
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            <!-- Search Input (RxJS debounced + cancellation) -->
            <div class="sm:col-span-8 relative">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchInput($event)"
                placeholder="Search by Title, Category, ID, or Owner..."
                class="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
              />
              <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                *ngIf="searchQuery"
                type="button"
                (click)="clearSearch()"
                class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Status Dropdown Filter -->
            <div class="sm:col-span-4">
              <select
                [(ngModel)]="selectedStatus"
                (ngModelChange)="onStatusChange()"
                class="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-700 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table Body -->
        <div class="relative overflow-x-auto min-h-[280px]">
          <!-- Loading Skeleton State -->
          <div *ngIf="recordsMetric.status === 'pending'" class="p-6">
            <div class="text-xs font-medium text-slate-500 mb-3 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
              Loading records (simulated delay: {{ recordsDelay }}ms)...
            </div>
            <app-loading-skeleton [rows]="pageSize"></app-loading-skeleton>
          </div>

          <!-- Error State with Dedicated Records-Only Retry -->
          <div *ngIf="recordsMetric.status === 'failed'" class="p-8 text-center">
            <div class="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-slate-900 mb-1">Failed to Fetch Records</h3>
            <p class="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {{ recordsErrorMessage || 'An error occurred while loading the records table. Your profile above remains available.' }}
            </p>
            <button
              type="button"
              (click)="triggerRecordsLoad()"
              class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Retry Records Request
            </button>
          </div>

          <!-- Empty State -->
          <div *ngIf="recordsMetric.status === 'completed' && records.length === 0" class="p-12 text-center">
            <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-slate-800 mb-1">No Matching Records Found</h3>
            <p class="text-xs text-slate-500 max-w-sm mx-auto mb-3">
              No records match your active search and status filters.
            </p>
            <button
              type="button"
              (click)="resetFilters()"
              class="px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 rounded border border-indigo-200 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

          <!-- Material-style Table -->
          <table
            *ngIf="recordsMetric.status === 'completed' && records.length > 0"
            class="w-full text-left border-collapse text-xs"
          >
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th class="py-3 px-4">Record ID</th>
                <th class="py-3 px-4">Title</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Last Updated</th>
                <!-- Owner column is visible ONLY to Admins -->
                <th *ngIf="isAdmin" class="py-3 px-4">Owner</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                *ngFor="let rec of records"
                class="hover:bg-slate-50/80 transition-colors"
              >
                <!-- Record ID -->
                <td class="py-3 px-4 font-mono font-medium text-indigo-600">
                  {{ rec.recordId }}
                </td>

                <!-- Title and Description -->
                <td class="py-3 px-4 max-w-xs">
                  <div class="font-medium text-slate-900 leading-snug">{{ rec.title }}</div>
                  <div class="text-[11px] text-slate-500 truncate mt-0.5">{{ rec.description }}</div>
                </td>

                <!-- Category -->
                <td class="py-3 px-4 text-slate-700">
                  <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                    {{ rec.category }}
                  </span>
                </td>

                <!-- Status Badge -->
                <td class="py-3 px-4">
                  <app-status-badge [status]="rec.status"></app-status-badge>
                </td>

                <!-- Last Updated -->
                <td class="py-3 px-4 text-slate-500 whitespace-nowrap">
                  {{ rec.lastUpdated | date:'mediumDate' }}
                  <span class="text-[10px] text-slate-400 block">{{ rec.lastUpdated | date:'shortTime' }}</span>
                </td>

                <!-- Owner (Admin only) -->
                <td *ngIf="isAdmin" class="py-3 px-4">
                  <div class="font-medium text-slate-800">{{ rec.ownerName }}</div>
                  <div class="text-[10px] font-mono text-slate-400">{{ rec.ownerId }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Toolbar -->
        <div
          *ngIf="recordsMetric.status === 'completed' && records.length > 0"
          class="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
        >
          <div class="flex items-center gap-2 text-slate-600">
            <span>Showing page {{ currentPage }} of {{ totalPages }} ({{ totalRecords }} total)</span>
            <span class="text-slate-300">·</span>
            <span class="text-slate-500">Per page:</span>
            <select
              [(ngModel)]="pageSize"
              (ngModelChange)="onPageSizeChange()"
              class="py-1 px-2 border border-slate-300 rounded bg-white text-xs text-slate-700"
            >
              <option [value]="5">5</option>
              <option [value]="10">10</option>
              <option [value]="20">20</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="goToPage(currentPage - 1)"
              [disabled]="currentPage <= 1 || recordsMetric.status === 'pending'"
              class="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              Previous
            </button>
            <span class="px-2 font-medium text-slate-800">{{ currentPage }} / {{ totalPages }}</span>
            <button
              type="button"
              (click)="goToPage(currentPage + 1)"
              [disabled]="currentPage >= totalPages || recordsMetric.status === 'pending'"
              class="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private recordService = inject(RecordService);
  private authService = inject(AuthService);

  profileUser: User | null = null;
  profileErrorMessage = '';

  records: PortalRecord[] = [];
  totalRecords = 0;
  totalPages = 1;
  currentPage = 1;
  pageSize = 5;

  searchQuery = '';
  selectedStatus = 'All';
  recordsErrorMessage = '';

  // Delays (configurable via panel)
  profileDelay = 0;
  recordsDelay = 1500;

  profileMetric: RequestMetric = { status: 'idle', durationMs: null };
  recordsMetric: RequestMetric = { status: 'idle', durationMs: null };

  private searchSubject = new Subject<string>();
  private recordsFetchSubject = new Subject<void>();
  private subscriptions: Subscription[] = [];

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  ngOnInit(): void {
    // 1. Independent search input stream with debounce & cancellation
    this.subscriptions.push(
      this.searchSubject.pipe(
        debounceTime(350),
        distinctUntilChanged()
      ).subscribe(() => {
        this.currentPage = 1;
        this.triggerRecordsLoad();
      })
    );

    // 2. Records fetch stream with switchMap to automatically cancel obsolete requests!
    this.subscriptions.push(
      this.recordsFetchSubject.pipe(
        switchMap(() => {
          this.recordsMetric = { status: 'pending', durationMs: null };
          this.recordsErrorMessage = '';
          const startTime = Date.now();

          return this.recordService.getRecords({
            delayMs: this.recordsDelay,
            search: this.searchQuery,
            status: this.selectedStatus,
            page: this.currentPage,
            limit: this.pageSize,
          }).pipe(
            catchError((err) => {
              const duration = Date.now() - startTime;
              this.recordsMetric = {
                status: 'failed',
                durationMs: duration,
                error: err.error?.error || 'Failed to fetch records',
              };
              this.recordsErrorMessage = err.error?.error || 'Records request failed.';
              return of(null as RecordsResponse | null);
            })
          );
        })
      ).subscribe((response) => {
        if (response) {
          this.records = response.records;
          this.totalRecords = response.total;
          this.totalPages = response.totalPages;
          this.recordsMetric = {
            status: 'completed',
            durationMs: response.serverDurationMs ?? null,
          };
        }
      })
    );

    // Start profile and records requests independently!
    this.loadProfile();
    this.triggerRecordsLoad();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadProfile(): void {
    this.profileMetric = { status: 'pending', durationMs: null };
    this.profileErrorMessage = '';
    const startTime = Date.now();

    this.userService.getProfile(this.profileDelay).subscribe({
      next: (user) => {
        this.profileUser = user;
        this.profileMetric = {
          status: 'completed',
          durationMs: user.serverDurationMs ?? (Date.now() - startTime),
        };
      },
      error: (err) => {
        this.profileMetric = {
          status: 'failed',
          durationMs: Date.now() - startTime,
          error: err.error?.error || 'Failed to load profile',
        };
        this.profileErrorMessage = err.error?.error || 'Profile request failed.';
      }
    });
  }

  triggerRecordsLoad(): void {
    this.recordsFetchSubject.next();
  }

  reloadBoth(): void {
    this.loadProfile();
    this.triggerRecordsLoad();
  }

  onProfileDelayChange(delay: number): void {
    this.profileDelay = delay;
  }

  onRecordsDelayChange(delay: number): void {
    this.recordsDelay = delay;
  }

  onSearchInput(query: string): void {
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 1;
    this.triggerRecordsLoad();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.triggerRecordsLoad();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = 'All';
    this.currentPage = 1;
    this.triggerRecordsLoad();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.triggerRecordsLoad();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.triggerRecordsLoad();
  }
}
