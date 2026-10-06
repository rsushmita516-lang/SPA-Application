import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service.js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div class="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <!-- Header Banner -->
        <div class="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/70 text-center">
          <div class="w-12 h-12 bg-indigo-600 rounded-lg text-white mx-auto flex items-center justify-center font-bold text-lg mb-3 shadow-md">
            AP
          </div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">User Access Portal</h1>
          <p class="text-xs text-slate-500 mt-1">Enterprise Role-Based Authentication System</p>
        </div>

        <div class="p-6 sm:p-8">
          <!-- Error Notification -->
          <div
            *ngIf="errorMessage"
            class="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800 text-xs leading-relaxed"
          >
            <svg class="w-4 h-4 shrink-0 text-rose-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="flex-1">
              <span class="font-semibold block mb-0.5">Authentication Failed</span>
              {{ errorMessage }}
            </div>
          </div>

          <!-- Login Reactive Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- User ID Field -->
            <div>
              <label for="userId" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                User ID <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <input
                  id="userId"
                  type="text"
                  formControlName="userId"
                  placeholder="e.g. admin1 or user1"
                  class="w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  [class.border-rose-300]="isFieldInvalid('userId')"
                  [class.border-slate-300]="!isFieldInvalid('userId')"
                />
              </div>
              <div *ngIf="isFieldInvalid('userId')" class="text-[11px] text-rose-600 mt-1">
                User ID is required.
              </div>
            </div>

            <!-- Password Field with Toggle -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label for="password" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password <span class="text-rose-500">*</span>
                </label>
              </div>
              <div class="relative">
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Enter your password"
                  class="w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors pr-10"
                  [class.border-rose-300]="isFieldInvalid('password')"
                  [class.border-slate-300]="!isFieldInvalid('password')"
                />
                <button
                  type="button"
                  (click)="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label="Toggle password visibility"
                >
                  <svg *ngIf="!showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                </button>
              </div>
              <div *ngIf="isFieldInvalid('password')" class="text-[11px] text-rose-600 mt-1">
                Password is required.
              </div>
            </div>

            <!-- Role Selector -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Role Selection <span class="text-rose-500">*</span>
              </label>
              <div class="grid grid-cols-2 gap-3">
                <label
                  class="cursor-pointer border rounded-lg p-3 text-center transition-all flex flex-col items-center"
                  [class.border-indigo-600]="loginForm.get('selectedRole')?.value === 'General User'"
                  [class.bg-indigo-50]="loginForm.get('selectedRole')?.value === 'General User'"
                  [class.border-slate-200]="loginForm.get('selectedRole')?.value !== 'General User'"
                >
                  <input
                    type="radio"
                    value="General User"
                    formControlName="selectedRole"
                    class="sr-only"
                  />
                  <span class="text-xs font-semibold text-slate-800">General User</span>
                  <span class="text-[10px] text-slate-500 mt-0.5">Scoped owner view</span>
                </label>

                <label
                  class="cursor-pointer border rounded-lg p-3 text-center transition-all flex flex-col items-center"
                  [class.border-indigo-600]="loginForm.get('selectedRole')?.value === 'Admin'"
                  [class.bg-indigo-50]="loginForm.get('selectedRole')?.value === 'Admin'"
                  [class.border-slate-200]="loginForm.get('selectedRole')?.value !== 'Admin'"
                >
                  <input
                    type="radio"
                    value="Admin"
                    formControlName="selectedRole"
                    class="sr-only"
                  />
                  <span class="text-xs font-semibold text-slate-800">Admin</span>
                  <span class="text-[10px] text-slate-500 mt-0.5">Full portal access</span>
                </label>
              </div>
              <div *ngIf="isFieldInvalid('selectedRole')" class="text-[11px] text-rose-600 mt-1">
                Please select a role.
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="isLoading || loginForm.invalid"
              class="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <svg *ngIf="isLoading" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isLoading ? 'Authenticating...' : 'Sign In to Portal' }}</span>
            </button>
          </form>

          <!-- Quick Test Seed Credentials Helper -->
          <div class="mt-6 pt-5 border-t border-slate-100">
            <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Quick Fill Demo Credentials
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="fillCredentials('admin1', 'Admin@123', 'Admin')"
                class="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded text-left transition-colors"
              >
                <div class="font-semibold text-indigo-700">Eleanor (Admin)</div>
                <div class="text-[10px] text-slate-400 font-mono">admin1 / Admin&#64;123</div>
              </button>
              <button
                type="button"
                (click)="fillCredentials('user1', 'User@123', 'General User')"
                class="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded text-left transition-colors"
              >
                <div class="font-semibold text-slate-700">Sarah (User)</div>
                <div class="text-[10px] text-slate-400 font-mono">user1 / User&#64;123</div>
              </button>
            </div>
            <div class="mt-2 text-center">
              <span class="text-[10px] text-slate-400">
                Note: Selected role is validated by the server. Selecting Admin with user1 will be rejected.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    userId: ['', [Validators.required]],
    password: ['', [Validators.required]],
    selectedRole: ['General User', [Validators.required]],
  });

  showPassword = false;
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  fillCredentials(userId: string, pass: string, role: 'Admin' | 'General User'): void {
    this.loginForm.patchValue({
      userId,
      password: pass,
      selectedRole: role,
    });
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { userId, password, selectedRole } = this.loginForm.value;

    this.authService.login({ userId, password, selectedRole }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Authentication failed. Please check your credentials.';
      }
    });
  }
}
