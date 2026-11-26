import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './config';

// What we send to the backend. The names must match the backend DTOs exactly,
// because the backend rejects any extra field with a 400 error.
export interface LoginBody {
  email: string;
  password: string;
}
export interface RegisterBody extends LoginBody {
  fullName: string;
  role: 'student' | 'Instructor'; // the backend writes Instructor with a capital I
}

// What the backend answers for both login and register.
interface AuthResponse {
  message: string;
  token: string;
}

const TOKEN_KEY = 'mocourse_token';

// Everything about "who is logged in" lives here, one place for the whole app.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // A signal holds a value the screen can watch. We start from the saved token (if any).
  private tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  token = this.tokenSignal.asReadonly();
  isLoggedIn = computed(() => this.tokenSignal() !== null);

  login(body: LoginBody) {
    return this.http
      .post<AuthResponse>(`${API_URL}/user/auth/login`, body)
      .pipe(tap((res) => this.saveToken(res.token)));
  }

  // Register also returns a token, so the new user is logged in right away.
  register(body: RegisterBody) {
    return this.http
      .post<AuthResponse>(`${API_URL}/user/auth/register`, body)
      .pipe(tap((res) => this.saveToken(res.token)));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.tokenSignal.set(null);
    this.router.navigateByUrl('/login');
  }

  // Keep the token in the browser so a refresh does not log the user out.
  private saveToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }
}
