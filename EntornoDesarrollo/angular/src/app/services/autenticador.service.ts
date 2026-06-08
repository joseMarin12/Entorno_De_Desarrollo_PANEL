import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  roleid?: number;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutenticadorService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
  // Aquí usamos la variable apiUrl de environment.prod.ts
  // Y apuntamos directamente al endpoint /login
  private readonly API_URL = `${environment.apiUrl}/login`;

  // Signal para el estado del usuario
  currentUser = signal<User | null>(this.getUserFromStorage());

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    // La petición ya apunta al backend correctamente ahora
    return this.http.post<LoginResponse>(this.API_URL, credentials).pipe(
      tap(response => {
        if (response.success && response.user) {
          // Normalización de roleid
          const rawUser = response.user as any;
          response.user.roleid = Number(rawUser.roleid || rawUser.role_id || rawUser.id_rol || rawUser.ID_ROL || 2);
          
          this.saveUser(response.user);
          if (response.token) {
            sessionStorage.setItem('token', response.token);
          }
          this.currentUser.set(response.user);
        }
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('firstLoginCompleted');
    this.firstLoginOverridden.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private saveUser(user: User): void {
    sessionStorage.setItem('user', JSON.stringify(user));
  }

  private getUserFromStorage(): User | null {
    const userJson = sessionStorage.getItem('user');
    if (!userJson) return null;
    
    try {
      const user = JSON.parse(userJson);
      if (user && !user.roleid) {
        user.roleid = Number(user.roleid || user.role_id || user.id_rol || user.ID_ROL || 2);
      }
      return user;
    } catch (e) {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  getDecodedToken(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch (e) {
      return null;
    }
  }

  getUserId(): number | null {
    return this.getDecodedToken()?.id || null;
  }

  getUserEmail(): string | null {
    return this.getDecodedToken()?.email || null;
  }

  private firstLoginOverridden = signal(sessionStorage.getItem('firstLoginCompleted') === 'true');

  isFirstLogin(): boolean {
    if (this.firstLoginOverridden()) return false;
    return this.getDecodedToken()?.firstLogin === true;
  }

  completeFirstLogin(): void {
    sessionStorage.setItem('firstLoginCompleted', 'true');
    this.firstLoginOverridden.set(true);
  }
}
