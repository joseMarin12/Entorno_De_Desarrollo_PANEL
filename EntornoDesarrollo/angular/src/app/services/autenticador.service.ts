import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  roleid?: number;
  name?: string;
  surname?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  // 🚀 EL FIX PARA EL COMPILADOR: Agregamos la propiedad al tipado oficial de la API
  firstLogin?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AutenticadorService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // URL centralizada apuntando al Proxy seguro de Laravel en Cloud Run
  private readonly API_URL = `${environment.apiUrl}/api/login`;

  // Signals para el estado global del sistema
  currentUser = signal<User | null>(this.getUserFromStorage());
  firstLoginOverridden = signal<boolean>(sessionStorage.getItem('firstLoginCompleted') === 'true');

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.API_URL, credentials).pipe(
      tap(response => {
        if (response.success && response.user) {
          // 1. Normalización estricta del rol del usuario
          const rawResponse = response as any;
          response.user.roleid = Number(rawResponse.user.roleid || rawResponse.user.role_id || rawResponse.user.id_rol || rawResponse.user.ID_ROL || 2);

          // 2. Guardar la persistencia del usuario en sesión
          this.saveUser(response.user);

          // 3. Normalización robusta y extracción del Token JWT
          const extractedToken = response.token ||
                                 rawResponse.accessToken ||
                                 rawResponse.jwt ||
                                 rawResponse.data?.token;

          if (extractedToken) {
            sessionStorage.setItem('token', extractedToken);
          } else {
            console.error('⚠️ ALERTA: Login exitoso pero el servidor no adjuntó un Token JWT válido.', response);
            sessionStorage.removeItem('token');
          }

          // 4. Actualizar el Signal reactivo global
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

  // --- Helpers de Persistencia en SessionStorage ---

  private saveUser(user: User): void {
    sessionStorage.setItem('user', JSON.stringify(user));
  }

  private getUserFromStorage(): User | null {
    const userJson = sessionStorage.getItem('user');
    if (!userJson) return null;

    try {
      const user = JSON.parse(userJson);
      if (user && !user.roleid) {
        user.roleid = 2; // Rol por defecto (Invitado/Usuario común)
      }
      return user;
    } catch (e) {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null && !!sessionStorage.getItem('token');
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  // --- Lógica Avanzada de Token y Desencriptación ---

  getDecodedToken(): any {
    const token = this.getToken();
    if (!token || token === 'usuario_autenticado') return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];

      // Reconstrucción del padding Base64Url
      let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }

      // Decodificación nativa segura soportando caracteres UTF-8/Acentos
      return JSON.parse(decodeURIComponent(escape(atob(base64))));
    } catch (e) {
      console.error('❌ Error crítico al decodificar el payload del JWT:', e);
      return null;
    }
  }

  getUserId(): number | null {
    return this.currentUser()?.id || null;
  }

  isFirstLogin(): boolean {
    if (this.firstLoginOverridden()) return false;
    const fl = this.getDecodedToken()?.firstLogin;
    return fl === true || fl === 'true' || fl === 't' || fl === 1 || fl === '1';
  }

  completeFirstLogin(): void {
    sessionStorage.setItem('firstLoginCompleted', 'true');
    this.firstLoginOverridden.set(true);
  }
}
