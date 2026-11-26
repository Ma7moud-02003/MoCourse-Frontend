import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';

// The page after login. For now it only proves the login worked and lets you log out.
// The real home page comes next.
@Component({
  selector: 'app-home',
  template: `
    <main class="grid min-h-screen place-content-center gap-4 text-center">
      <h1 class="text-2xl font-bold">أهلًا بيك في MoCourse</h1>
      <p>تم تسجيل الدخول بنجاح.</p>
      <button
        class="mx-auto w-full max-w-[200px] cursor-pointer rounded-xl bg-plum p-3.5 font-bold text-white transition-colors hover:bg-plum-dark"
        (click)="auth.logout()"
      >
        تسجيل خروج
      </button>
    </main>
  `,
})
export class Home {
  auth = inject(AuthService);
}
