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
  
  // URL base apuntando a tu backend
  private readonly API_URL = `${environment.apiUrl}/api/login`;

  // Signals para el estado global
  currentUser = signal<User | null>(this.getUserFromStorage());
  firstLoginOverridden = signal<boolean>(sessionStorage.getItem('firstLoginCompleted') === 'true');

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.API_URL, credentials).pipe(
      tap(response => {
        if (response.success && response.user) {
          // 1. Normalización de rol
          const rawUser = response.user as any;
          response.user.roleid = Number(rawUser.roleid || rawUser.role_id || rawUser.id_rol || rawUser.ID_ROL || 2);
          
          // 2. Guardar persistencia (Centralizado aquí)
          this.saveUser(response.user);
          
          // Guardamos token (Si el backend devuelve uno, lo usamos; si no, ponemos un valor por defecto para el Guard)
          sessionStorage.setItem('token', response.token || 'usuario_autenticado');
          
          // 3. Actualizar signal
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

  // --- Helpers de Persistencia ---

  private saveUser(user: User): void {
    sessionStorage.setItem('user', JSON.stringify(user));
  }

  private getUserFromStorage(): User | null {
    const userJson = sessionStorage.getItem('user');
    if (!userJson) return null;
    
    try {
      const user = JSON.parse(userJson);
      // Aseguramos que el rol exista al recuperar
      if (user && !user.roleid) {
        user.roleid = 2; // Default
      }
      return user;
    } catch (e) {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null || !!sessionStorage.getItem('token');
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  // --- Lógica de Token y Primer Login ---

  getDecodedToken(): any {
    const token = this.getToken();
    if (!token || token === 'usuario_autenticado') return null; // No se puede decodificar un string plano
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch (e) {
      return null;
    }
  }

  getUserId(): number | null {
    return this.currentUser()?.id || null;
  }

  isFirstLogin(): boolean {
    if (this.firstLoginOverridden()) return false;
    return this.getDecodedToken()?.firstLogin === true;
  }

  completeFirstLogin(): void {
    sessionStorage.setItem('firstLoginCompleted', 'true');
    this.firstLoginOverridden.set(true);
  }
}
