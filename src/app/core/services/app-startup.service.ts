import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service.js';

@Injectable({
  providedIn: 'root'
})
export class AppStartupService {
  private authService = inject(AuthService);

  public async initializeApp(): Promise<void> {
    try {
      await firstValueFrom(this.authService.checkSession());
    } catch (err) {
      console.warn('App startup session restore error:', err);
    }
  }
}
