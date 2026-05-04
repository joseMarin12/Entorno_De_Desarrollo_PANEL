import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AutenticadorService } from '../services/autenticador.service';

export const autenticadorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AutenticadorService);
  const router = inject(Router);

  const hasToken = !!sessionStorage.getItem('token');

  if (authService.isAuthenticated() && hasToken) {
    return true;
  }

  // Si no está autenticado, redirigir al login
  return router.createUrlTree(['/login']);
};
