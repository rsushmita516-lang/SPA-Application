import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../shared/models/user.model.js';

@Component({
  selector: 'app-delete-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  inputs: ['user', 'isDeleting'],
  outputs: ['confirm', 'cancel'],
  template: `
    <!-- Modal Backdrop -->
    <div class="dialog-backdrop fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <!-- Confirmation Dialog -->
      <div class="dialog-panel bg-white rounded-lg shadow-2xl border border-slate-200 max-w-md w-full p-6">
        <div class="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <h3 class="text-base font-bold text-slate-900 text-center mb-1">Confirm Soft Deletion</h3>
        <p class="text-xs text-slate-500 text-center mb-4 leading-relaxed">
          Are you sure you want to soft-delete user
          <strong class="text-slate-800">{{ user?.name }}</strong>
          (<span class="font-mono text-slate-700">{{ user?.userId }}</span>)?
        </p>

        <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 mb-6">
          <div class="font-semibold text-slate-700 mb-1">Persistence Policy:</div>
          The user record will be marked as <code class="text-rose-600 bg-rose-50 px-1 py-0.5 rounded">isDeleted: true</code> and status set to <code class="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">Inactive</code> in MongoDB. All their associated access records remain intact.
        </div>

        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            (click)="cancel.emit()"
            [disabled]="isDeleting"
            class="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="confirm.emit()"
            [disabled]="isDeleting"
            class="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg *ngIf="isDeleting" class="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isDeleting ? 'Soft Deleting...' : 'Confirm Soft Deletion' }}</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class DeleteConfirmDialogComponent {
  @Input() user: User | null = null;
  @Input() isDeleting = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
