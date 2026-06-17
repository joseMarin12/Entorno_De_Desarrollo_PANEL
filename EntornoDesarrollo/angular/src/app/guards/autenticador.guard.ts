import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AutenticadorService } from '../services/autenticador.service';

export const autenticadorGuard: CanActivateFn = () => {
  const authService = inject(AutenticadorService);
  const router = inject(Router);

  // Verificamos si existe el token
  const hasToken = !!sessionStorage.getItem('token');

  if (authService.isAuthenticated() && hasToken) {
    return true;
  }

  // Si falla, redirigimos al login sin logs de consola
  return router.createUrlTree(['/login']);
};
