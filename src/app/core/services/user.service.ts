import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserPayload, UpdateUserPayload } from '../../shared/models/user.model.js';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  /**
   * Fetches the authenticated user profile with optional simulated delay
   */
  public getProfile(delayMs?: number): Observable<User> {
    let params = new HttpParams();
    if (delayMs !== undefined && delayMs !== null) {
      params = params.set('delayMs', delayMs.toString());
    }
    return this.http.get<User>('/api/users/me', { params, withCredentials: true });
  }

  /**
   * Fetches user list for admin management
   */
  public getUsers(): Observable<{ users: User[]; total: number }> {
    return this.http.get<{ users: User[]; total: number }>('/api/users', { withCredentials: true });
  }

  /**
   * Admin creates a new portal user
   */
  public createUser(payload: CreateUserPayload): Observable<{ success: boolean; user: User }> {
    return this.http.post<{ success: boolean; user: User }>('/api/users', payload, { withCredentials: true });
  }

  /**
   * Admin edits existing user details or toggles account status
   */
  public updateUser(userId: string, payload: UpdateUserPayload): Observable<{ success: boolean; user: User }> {
    return this.http.patch<{ success: boolean; user: User }>(`/api/users/${encodeURIComponent(userId)}`, payload, { withCredentials: true });
  }

  /**
   * Admin soft-deletes a user
   */
  public deleteUser(userId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`/api/users/${encodeURIComponent(userId)}`, { withCredentials: true });
  }
}
