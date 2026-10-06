import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { User, LoginRequest, LoginResponse, AuthSessionResponse } from '../../shared/models/user.model.js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private isInitializingSubject = new BehaviorSubject<boolean>(true);
  public isInitializing$ = this.isInitializingSubject.asObservable();

  private csrfToken: string = '';

  public get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  public get isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'Admin';
  }

  public getCsrfToken(): string {
    return this.csrfToken;
  }

  public setCsrfToken(token: string): void {
    this.csrfToken = token;
  }

  /**
   * Restores session on app startup / page refresh
   */
  public checkSession(): Observable<AuthSessionResponse> {
    return this.http.get<AuthSessionResponse>('/api/auth/session', { withCredentials: true }).pipe(
      tap((res) => {
        if (res.csrfToken) {
          this.csrfToken = res.csrfToken;
        }
        if (res.authenticated && res.user) {
          this.currentUserSubject.next(res.user);
          this.isAuthenticatedSubject.next(true);
        } else {
          this.currentUserSubject.next(null);
          this.isAuthenticatedSubject.next(false);
        }
        this.isInitializingSubject.next(false);
      }),
      catchError((err) => {
        console.warn('Session verification failed:', err);
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        this.isInitializingSubject.next(false);
        return of({ authenticated: false, user: null, csrfToken: '' });
      })
    );
  }

  /**
   * Log in user with credentials and validate role
   */
  public login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', credentials, { withCredentials: true }).pipe(
      tap((res) => {
        if (res.csrfToken) {
          this.csrfToken = res.csrfToken;
        }
        if (res.success && res.user) {
          this.currentUserSubject.next(res.user);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  /**
   * Log out active session
   */
  public logout(): Observable<any> {
    return this.http.post('/api/auth/logout', {}, { withCredentials: true }).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
      }),
      catchError(() => {
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        return of(null);
      })
    );
  }
}
