import { HttpErrorResponse } from '@angular/common/http';
import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterBody } from '../../core/auth.service';
import { errorMessage } from '../../core/error-message';
import { AuthShell } from '../auth-shell/auth-shell';
import { SocialButtons } from '../social-buttons/social-buttons';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, NgClass, AuthShell, SocialButtons],
  templateUrl: './register.html',
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);

  // The two choices at the top of the page (value = what the backend expects)
  roles: { value: RegisterBody['role']; label: string; hint: string }[] = [
    { value: 'student', label: 'طالب', hint: 'عايز أتعلم' },
    { value: 'Instructor', label: 'مدرّس', hint: 'عايز أشرح كورساتي' },
  ];

  form = inject(FormBuilder).nonNullable.group({
    role: ['student' as RegisterBody['role']],
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(150)]],
  });

  loading = signal(false);
  serverError = signal('');

  // Clicking a role card sets the role field in the form
  chooseRole(role: RegisterBody['role']) {
    this.form.controls.role.setValue(role);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set('');

    // The backend logs us in directly after register (it sends a token), so go to the courses page.
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(this.auth.home()),
      error: (err: HttpErrorResponse) => {
        this.serverError.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  showError(name: 'fullName' | 'email' | 'password') {
    const c = this.form.controls[name];
    return c.invalid && c.touched;
  }
}
