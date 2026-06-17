import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AutenticadorService } from '../services/autenticador.service';

export const autenticadorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AutenticadorService);
  const router = inject(Router);

  const hasToken = !!sessionStorage.getItem('token');
  const isAuthenticated = authService.isAuthenticated();

  // 🚀 LOGS DE DEPURACIÓN (Mira tu consola F12 al intentar entrar)
  console.log('🔍 Guard Check:', { 
    isAuthenticated, 
    hasToken,
    currentUser: authService.currentUser() // Para ver si realmente hay usuario cargado
  });

  if (isAuthenticated && hasToken) {
    return true;
  }

  // Si falla, el log nos dirá por qué
  console.warn('🚫 Guard bloqueó el acceso. Redirigiendo a login.');
  return router.createUrlTree(['/login']);
};
