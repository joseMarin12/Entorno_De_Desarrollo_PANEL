import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutenticadorService } from '../../../../services/autenticador.service';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AutenticadorService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  loading = false;

  onSubmit(): void {
    // ... (código existente)
    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response); // 👈 ¡AGREGA ESTO!
        
        if (response && response.success === true) { // 👈 Aseguramos que sea estrictamente true
          this.toastService.show('success', '¡Bienvenido!');
          this.router.navigate(['/usuarios']); 
        } else {
          this.toastService.show('error', response.message || 'Error desconocido');
        }
        this.loading = false;
      },

    this.loading = true;
    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.show('success', '¡Bienvenido!');
          this.router.navigate(['/usuarios']); // O la ruta que prefieras por defecto
        } else {
          this.toastService.show('error', response.message || 'Credenciales incorrectas');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Login error:', err);
        this.toastService.show('error', 'Error al conectar con el servidor');
        this.loading = false;
      }
    });
  }
}
