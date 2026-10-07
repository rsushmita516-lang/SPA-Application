import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, CreateUserPayload, UpdateUserPayload } from '../../shared/models/user.model.js';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  inputs: ['initialUser', 'currentAdminId', 'isSaving', 'errorMessage'],
  outputs: ['saveCreate', 'saveUpdate', 'cancel'],
  template: `
    <!-- Modal Backdrop -->
    <div class="dialog-backdrop fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <!-- Dialog Card -->
      <div class="dialog-panel bg-white rounded-lg shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <!-- Dialog Header -->
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-slate-900">
              {{ isEditMode ? 'Edit User: ' + (initialUser?.userId || '') : 'Create New User' }}
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ isEditMode ? 'Update account attributes and privileges' : 'Provision a new identity with role-based access' }}
            </p>
          </div>
          <button
            type="button"
            (click)="cancel.emit()"
            class="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form Body -->
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <!-- Self protection banner -->
          <div *ngIf="isSelf" class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
            <span class="font-semibold block mb-0.5">Self-Account Protection Active</span>
            You are editing your own admin account. Role demotion and deactivation are locked.
          </div>

          <!-- Error Banner -->
          <div *ngIf="errorMessage" class="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
            {{ errorMessage }}
          </div>

          <!-- User ID (Create only) -->
          <div *ngIf="!isEditMode">
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              User ID <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              formControlName="userId"
              placeholder="e.g. dev_sarah or ops_mark"
              class="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              [class.border-rose-300]="isFieldInvalid('userId')"
              [class.border-slate-300]="!isFieldInvalid('userId')"
            />
            <div *ngIf="isFieldInvalid('userId')" class="text-[11px] text-rose-600 mt-1">
              User ID is required (3-20 characters alphanumeric).
            </div>
          </div>

          <!-- Full Name -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g. Jane Doe"
              class="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              [class.border-rose-300]="isFieldInvalid('name')"
              [class.border-slate-300]="!isFieldInvalid('name')"
            />
            <div *ngIf="isFieldInvalid('name')" class="text-[11px] text-rose-600 mt-1">
              Name is required.
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address <span class="text-rose-500">*</span>
            </label>
            <input
              type="email"
              formControlName="email"
              placeholder="name@portal.internal"
              class="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              [class.border-rose-300]="isFieldInvalid('email')"
              [class.border-slate-300]="!isFieldInvalid('email')"
            />
            <div *ngIf="isFieldInvalid('email')" class="text-[11px] text-rose-600 mt-1">
              A valid email address is required.
            </div>
          </div>

          <!-- Password (Create only) -->
          <div *ngIf="!isEditMode">
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Password <span class="text-rose-500">*</span>
            </label>
            <input
              type="password"
              formControlName="password"
              placeholder="Minimum 6 characters"
              class="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              [class.border-rose-300]="isFieldInvalid('password')"
              [class.border-slate-300]="!isFieldInvalid('password')"
            />
            <div *ngIf="isFieldInvalid('password')" class="text-[11px] text-rose-600 mt-1">
              Password must be at least 6 characters.
            </div>
          </div>

          <!-- Role -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Role Access Level
            </label>
            <select
              formControlName="role"
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="General User">General User (Scoped own records only)</option>
              <option value="Admin">Admin (Full system and user management)</option>
            </select>
          </div>

          <!-- Status (Edit mode only) -->
          <div *ngIf="isEditMode">
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Account Status
            </label>
            <select
              formControlName="status"
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <!-- Dialog Footer Buttons -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              (click)="cancel.emit()"
              class="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="userForm.invalid || isSaving"
              class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {{ isSaving ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class UserDialogComponent implements OnInit {
  @Input() initialUser: User | null = null;
  @Input() currentAdminId: string = '';
  @Input() isSaving = false;
  @Input() errorMessage = '';

  @Output() saveCreate = new EventEmitter<CreateUserPayload>();
  @Output() saveUpdate = new EventEmitter<UpdateUserPayload>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  userForm!: FormGroup;

  get isEditMode(): boolean {
    return !!this.initialUser;
  }

  get isSelf(): boolean {
    return this.isEditMode && this.initialUser?.userId === this.currentAdminId;
  }

  ngOnInit(): void {
    if (this.isEditMode && this.initialUser) {
      this.userForm = this.fb.group({
        name: [this.initialUser.name, [Validators.required]],
        email: [this.initialUser.email, [Validators.required, Validators.email]],
        role: [{ value: this.initialUser.role, disabled: this.isSelf }, [Validators.required]],
        status: [{ value: this.initialUser.status, disabled: this.isSelf }, [Validators.required]],
      });
    } else {
      this.userForm = this.fb.group({
        userId: ['', [Validators.required, Validators.minLength(3)]],
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        role: ['General User', [Validators.required]],
      });
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.userForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const rawValues = this.userForm.getRawValue();

    if (this.isEditMode) {
      this.saveUpdate.emit({
        name: rawValues.name,
        email: rawValues.email,
        role: rawValues.role,
        status: rawValues.status,
      });
    } else {
      this.saveCreate.emit({
        userId: rawValues.userId,
        name: rawValues.name,
        email: rawValues.email,
        password: rawValues.password,
        role: rawValues.role,
      });
    }
  }
}
