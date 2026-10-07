import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service.js';
import { AuthService } from '../../core/services/auth.service.js';
import { User, CreateUserPayload, UpdateUserPayload } from '../../shared/models/user.model.js';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component.js';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton.component.js';
import { UserDialogComponent } from './user-dialog.component.js';
import { DeleteConfirmDialogComponent } from './delete-confirm-dialog.component.js';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadgeComponent,
    LoadingSkeletonComponent,
    UserDialogComponent,
    DeleteConfirmDialogComponent,
    DatePipe,
  ],
  template: `
    <div class="space-y-6 animate-[dialog-in_260ms_ease-out]">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="page-title text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
              Admin Exclusive
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            Provision, modify, activate/deactivate, and soft-delete system users with MongoDB persistence.
          </p>
        </div>

        <button
          type="button"
          (click)="openCreateDialog()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create New User
        </button>
      </div>

      <!-- Notification Messages -->
      <div
        *ngIf="feedbackMessage"
        class="p-4 rounded-lg text-xs flex items-center justify-between border"
        [ngClass]="feedbackIsError ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'"
      >
        <div class="flex items-center gap-2">
          <svg *ngIf="!feedbackIsError" class="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg *ngIf="feedbackIsError" class="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ feedbackMessage }}</span>
        </div>
        <button type="button" (click)="feedbackMessage = ''" class="text-slate-400 hover:text-slate-600 p-1">
          ✕
        </button>
      </div>

      <!-- Users Table Card -->
      <div class="surface-card data-table overflow-hidden">
        <!-- Table Toolbar -->
        <div class="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-slate-900">Registered Identities</span>
            <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {{ filteredUsers.length }} total
            </span>
          </div>

          <div class="flex items-center gap-2">
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchFilter"
                placeholder="Filter users..."
                class="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
              />
              <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              type="button"
              (click)="loadUsers()"
              [disabled]="isLoading"
              class="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="p-6">
          <app-loading-skeleton [rows]="4"></app-loading-skeleton>
        </div>

        <!-- Users Table -->
        <div *ngIf="!isLoading" class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th class="py-3 px-4">User</th>
                <th class="py-3 px-4">User ID</th>
                <th class="py-3 px-4">Email</th>
                <th class="py-3 px-4">Role</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Registered</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                *ngFor="let user of filteredUsers"
                class="hover:bg-slate-50/80 transition-colors"
                [class.opacity-60]="user.isDeleted"
              >
                <!-- User Name & Avatar -->
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                      [class.bg-indigo-600]="user.role === 'Admin'"
                      [class.bg-slate-700]="user.role !== 'Admin'"
                      class="text-white"
                    >
                      {{ user.name.charAt(0) }}
                    </div>
                    <div>
                      <span class="font-medium text-slate-900 block leading-tight">{{ user.name }}</span>
                      <span *ngIf="isSelf(user)" class="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                        (You)
                      </span>
                    </div>
                  </div>
                </td>

                <!-- User ID -->
                <td class="py-3 px-4 font-mono font-medium text-slate-700">
                  {{ user.userId }}
                </td>

                <!-- Email -->
                <td class="py-3 px-4 text-slate-600">
                  {{ user.email }}
                </td>

                <!-- Role -->
                <td class="py-3 px-4">
                  <span
                    class="px-2 py-0.5 rounded text-[11px] font-semibold border"
                    [class.bg-indigo-50]="user.role === 'Admin'"
                    [class.text-indigo-700]="user.role === 'Admin'"
                    [class.border-indigo-200]="user.role === 'Admin'"
                    [class.bg-slate-50]="user.role !== 'Admin'"
                    [class.text-slate-700]="user.role !== 'Admin'"
                    [class.border-slate-200]="user.role !== 'Admin'"
                  >
                    {{ user.role }}
                  </span>
                </td>

                <!-- Status -->
                <td class="py-3 px-4">
                  <span *ngIf="user.isDeleted" class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-rose-50 text-rose-800 border border-rose-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Deleted (Soft)
                  </span>
                  <app-status-badge *ngIf="!user.isDeleted" [status]="user.status"></app-status-badge>
                </td>

                <!-- Registered Date -->
                <td class="py-3 px-4 text-slate-500 whitespace-nowrap">
                  {{ (user.createdAt | date:'mediumDate') || 'Standard' }}
                </td>

                <!-- Actions -->
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Edit Button -->
                    <button
                      type="button"
                      (click)="openEditDialog(user)"
                      [disabled]="user.isDeleted"
                      class="px-2 py-1 text-xs font-medium text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded transition-colors cursor-pointer disabled:opacity-40"
                      title="Edit attributes"
                    >
                      Edit
                    </button>

                    <!-- Toggle Status Button (Active / Inactive) -->
                    <button
                      *ngIf="!user.isDeleted"
                      type="button"
                      (click)="toggleUserStatus(user)"
                      [disabled]="isSelf(user)"
                      [title]="isSelf(user) ? 'You cannot deactivate your own account' : 'Toggle Active/Inactive'"
                      class="px-2 py-1 text-xs font-medium rounded border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      [ngClass]="user.status === 'Active' ? 'text-amber-700 hover:bg-amber-50 border-slate-200 hover:border-amber-200' : 'text-emerald-700 hover:bg-emerald-50 border-slate-200 hover:border-emerald-200'"
                    >
                      {{ user.status === 'Active' ? 'Deactivate' : 'Activate' }}
                    </button>

                    <!-- Soft Delete Button -->
                    <button
                      *ngIf="!user.isDeleted"
                      type="button"
                      (click)="openDeleteDialog(user)"
                      [disabled]="isSelf(user)"
                      [title]="isSelf(user) ? 'You cannot delete your own account' : 'Soft delete user'"
                      class="px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create / Edit User Dialog Modal -->
      <app-user-dialog
        *ngIf="showUserDialog"
        [initialUser]="selectedUser"
        [currentAdminId]="currentAdminId"
        [isSaving]="isSubmitting"
        [errorMessage]="dialogError"
        (saveCreate)="handleCreateUser($event)"
        (saveUpdate)="handleUpdateUser($event)"
        (cancel)="closeUserDialog()"
      ></app-user-dialog>

      <!-- Soft-Delete Confirmation Dialog Modal -->
      <app-delete-confirm-dialog
        *ngIf="showDeleteDialog"
        [user]="selectedUser"
        [isDeleting]="isSubmitting"
        (confirm)="handleDeleteUser()"
        (cancel)="closeDeleteDialog()"
      ></app-delete-confirm-dialog>
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  users: User[] = [];
  searchFilter = '';
  isLoading = false;

  showUserDialog = false;
  showDeleteDialog = false;
  selectedUser: User | null = null;
  isSubmitting = false;
  dialogError = '';

  feedbackMessage = '';
  feedbackIsError = false;

  get currentAdminId(): string {
    return this.authService.currentUser?.userId || '';
  }

  get filteredUsers(): User[] {
    if (!this.searchFilter.trim()) {
      return this.users;
    }
    const q = this.searchFilter.toLowerCase().trim();
    return this.users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.userId.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  isSelf(user: User): boolean {
    return user.userId === this.currentAdminId;
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.isLoading = false;
        this.users = res.users;
      },
      error: (err) => {
        this.isLoading = false;
        this.showFeedback(err.error?.error || 'Failed to fetch users.', true);
      }
    });
  }

  openCreateDialog(): void {
    this.selectedUser = null;
    this.dialogError = '';
    this.showUserDialog = true;
  }

  openEditDialog(user: User): void {
    this.selectedUser = user;
    this.dialogError = '';
    this.showUserDialog = true;
  }

  closeUserDialog(): void {
    this.showUserDialog = false;
    this.selectedUser = null;
    this.dialogError = '';
  }

  openDeleteDialog(user: User): void {
    if (this.isSelf(user)) {
      this.showFeedback('Self-protection: You cannot delete your own Admin account.', true);
      return;
    }
    this.selectedUser = user;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
    this.selectedUser = null;
  }

  handleCreateUser(payload: CreateUserPayload): void {
    this.isSubmitting = true;
    this.dialogError = '';

    this.userService.createUser(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeUserDialog();
        this.showFeedback(`User '${payload.userId}' created successfully.`, false);
        this.loadUsers();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.dialogError = err.error?.error || 'Failed to create user.';
      }
    });
  }

  handleUpdateUser(payload: UpdateUserPayload): void {
    if (!this.selectedUser) return;
    this.isSubmitting = true;
    this.dialogError = '';

    this.userService.updateUser(this.selectedUser.userId, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeUserDialog();
        this.showFeedback(`User '${this.selectedUser?.userId}' updated successfully.`, false);
        this.loadUsers();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.dialogError = err.error?.error || 'Failed to update user.';
      }
    });
  }

  toggleUserStatus(user: User): void {
    if (this.isSelf(user)) {
      this.showFeedback('Self-protection: You cannot deactivate your own Admin account.', true);
      return;
    }

    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    this.userService.updateUser(user.userId, { status: nextStatus }).subscribe({
      next: () => {
        this.showFeedback(`User '${user.userId}' status updated to ${nextStatus}.`, false);
        this.loadUsers();
      },
      error: (err) => {
        this.showFeedback(err.error?.error || 'Failed to update user status.', true);
      }
    });
  }

  handleDeleteUser(): void {
    if (!this.selectedUser) return;
    const targetUserId = this.selectedUser.userId;

    this.isSubmitting = true;
    this.userService.deleteUser(targetUserId).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeDeleteDialog();
        this.showFeedback(`User '${targetUserId}' soft-deleted successfully.`, false);
        this.loadUsers();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showFeedback(err.error?.error || 'Failed to soft-delete user.', true);
      }
    });
  }

  private showFeedback(msg: string, isError: boolean): void {
    this.feedbackMessage = msg;
    this.feedbackIsError = isError;
    if (!isError) {
      setTimeout(() => {
        if (this.feedbackMessage === msg) {
          this.feedbackMessage = '';
        }
      }, 5000);
    }
  }
}
