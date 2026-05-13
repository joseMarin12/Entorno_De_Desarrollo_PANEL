import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AutenticadorService } from '../../../../services/autenticador.service';
import { UsuariosService } from '../../../../services/usuarios.service';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AutenticadorService);
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = false;

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const pass = control.get('newPassword')?.value;
    const confirm = control.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const userId = this.authService.getUserId();
    const newPassword = this.form.get('newPassword')?.value;

    if (!userId) {
      this.toast.show('error', 'Sesión inválida. Por favor, vuelve a loguearte.');
      this.authService.logout();
      return;
    }

    this.usuariosService.changePassword(userId, newPassword!).subscribe({
      next: () => {
        this.toast.show('success', 'Contraseña actualizada correctamente.');
        this.authService.completeFirstLogin();
        this.router.navigate(['/usuarios']);
      },
      error: (err) => {
        console.error(err);
        this.toast.show('error', 'Error al cambiar la contraseña. Inténtalo de nuevo.');
        this.loading = false;
      }
    });
  }
}
