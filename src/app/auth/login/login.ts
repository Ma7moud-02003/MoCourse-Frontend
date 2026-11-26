import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/error-message';
import { AuthShell } from '../auth-shell/auth-shell';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  // The form: each field has its rules. These rules mirror the backend (password 6+ characters).
  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(150)]],
  });

  loading = signal(false); // true while we wait for the server
  serverError = signal(''); // the server's answer when it fails

  submit() {
    // Wrong input: show the errors under the fields and stop.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set('');

    // Send email + password. On success we go to the home page.
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/home'),
      error: (err: HttpErrorResponse) => {
        this.serverError.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  // Helper for the template: should we show the red error on this field?
  showError(name: 'email' | 'password') {
    const c = this.form.controls[name];
    return c.invalid && c.touched;
  }
}
