import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AutenticadorService } from '../services/autenticador.service';

export const firstLoginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AutenticadorService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const isFirst = authService.isFirstLogin();
  const isChangePassRoute = state.url.includes('/change-password');

  // Si es primer login y no estamos en la página de cambio, forzar redirección
  if (isFirst && !isChangePassRoute) {
    return router.createUrlTree(['/change-password']);
  }

  // Si NO es primer login e intentamos entrar a cambio de pass, redirigir a dashboard (usuarios)
  if (!isFirst && isChangePassRoute) {
    return router.createUrlTree(['/usuarios']);
  }

  return true;
};
