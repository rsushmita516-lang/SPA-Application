import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#24292f] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px); background-size: 32px 32px;"></div>
      <div class="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-slate-300 overflow-hidden animate-[dialog-in_260ms_ease-out]">
        <div class="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/70 text-center">
          <div class="w-12 h-12 bg-blue-600 rounded-lg text-white mx-auto flex items-center justify-center font-bold text-lg mb-3 shadow-md">
            AP
          </div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">Create an account</h1>
          <p class="text-xs text-slate-500 mt-1">Register for the User Access Portal</p>
        </div>

        <div class="p-6 sm:p-8">
          <div *ngIf="errorMessage" class="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs leading-relaxed">
            {{ errorMessage }}
          </div>
          <div *ngIf="successMessage" class="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs leading-relaxed">
            {{ successMessage }}
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label for="name" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full name</label>
                <input id="name" type="text" formControlName="name" placeholder="Jane Smith" class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div *ngIf="isInvalid('name')" class="text-[11px] text-rose-600 mt-1">Name is required.</div>
              </div>
              <div>
                <label for="userId" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">User ID</label>
                <input id="userId" type="text" formControlName="userId" placeholder="jane_smith" class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div *ngIf="isInvalid('userId')" class="text-[11px] text-rose-600 mt-1">Use 3-20 letters, numbers, dashes, or underscores.</div>
              </div>
            </div>

            <div>
              <label for="email" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email</label>
              <input id="email" type="email" formControlName="email" placeholder="jane@example.com" class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div *ngIf="isInvalid('email')" class="text-[11px] text-rose-600 mt-1">Enter a valid email address.</div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label for="password" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                <input id="password" type="password" formControlName="password" placeholder="At least 6 characters" class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div *ngIf="isInvalid('password')" class="text-[11px] text-rose-600 mt-1">Password must be at least 6 characters.</div>
              </div>
              <div>
                <label for="confirmPassword" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Confirm password</label>
                <input id="confirmPassword" type="password" formControlName="confirmPassword" placeholder="Repeat your password" class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div *ngIf="isInvalid('confirmPassword') || (registerForm.errors?.['passwordsMismatch'] && registerForm.get('confirmPassword')?.touched)" class="text-[11px] text-rose-600 mt-1">Passwords must match.</div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Account role</label>
              <div class="grid grid-cols-2 gap-3">
                <label class="cursor-pointer border rounded-lg p-3 text-center transition-all" [class.border-indigo-600]="registerForm.get('role')?.value === 'General User'" [class.bg-indigo-50]="registerForm.get('role')?.value === 'General User'" [class.border-slate-200]="registerForm.get('role')?.value !== 'General User'">
                  <input type="radio" value="General User" formControlName="role" class="sr-only" />
                  <span class="text-xs font-semibold text-slate-800">General User</span>
                  <span class="block text-[10px] text-slate-500 mt-0.5">Own records only</span>
                </label>
                <label class="cursor-pointer border rounded-lg p-3 text-center transition-all" [class.border-indigo-600]="registerForm.get('role')?.value === 'Admin'" [class.bg-indigo-50]="registerForm.get('role')?.value === 'Admin'" [class.border-slate-200]="registerForm.get('role')?.value !== 'Admin'">
                  <input type="radio" value="Admin" formControlName="role" class="sr-only" />
                  <span class="text-xs font-semibold text-slate-800">Admin</span>
                  <span class="block text-[10px] text-slate-500 mt-0.5">Full portal access</span>
                </label>
              </div>
              <p class="text-[10px] text-amber-700 mt-2">Admin accounts have access to all records and user management.</p>
            </div>

            <button type="submit" [disabled]="isLoading || registerForm.invalid" class="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium text-sm rounded-md shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed">
              {{ isLoading ? 'Creating account...' : 'Create account' }}
            </button>
          </form>

          <p class="text-center text-xs text-slate-500 mt-6">
            Already have an account?
            <a routerLink="/login" class="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    userId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]{3,20}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    role: ['General User' as 'Admin' | 'General User', [Validators.required]],
  }, { validators: passwordsMatch });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  isInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const { name, userId, email, password, role } = this.registerForm.getRawValue();

    this.http.post<{ success: boolean }>('/api/auth/register', { name, userId, email, password, role }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Account created successfully. Redirecting to sign in...';
        setTimeout(() => this.router.navigate(['/login']), 900);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Unable to create your account. Please try again.';
      },
    });
  }
}
