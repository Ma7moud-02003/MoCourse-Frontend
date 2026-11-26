import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';

// The page after login. For now it only proves the login worked and lets you log out.
// The real home page comes next.
@Component({
  selector: 'app-home',
  template: `
    <main style="min-height:100vh;display:grid;place-content:center;text-align:center;gap:16px">
      <h1>أهلًا بيك في MoCourse</h1>
      <p>تم تسجيل الدخول بنجاح.</p>
      <button class="btn" style="max-width:200px;margin:auto" (click)="auth.logout()">تسجيل خروج</button>
    </main>
  `,
})
export class Home {
  auth = inject(AuthService);
}
