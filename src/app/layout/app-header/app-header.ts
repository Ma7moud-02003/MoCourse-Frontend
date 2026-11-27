import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';

// The bar at the top of every page a logged-in student sees:
// the logo, the links between pages, and the way out (log out).
// It is a small component so every new page can reuse it with one line: <app-header />
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div class="mx-auto flex h-16 w-full max-w-[1120px] items-center gap-3 px-5">
        <!-- The logo is also the link back to the courses page -->
        <a routerLink="/courses" class="flex items-center gap-2 text-[19px] font-bold">
          <img src="logo.svg" alt="" width="34" height="34" />
          <strong class="hidden sm:inline">MoCourse</strong>
        </a>

        <nav class="ms-1 flex items-center gap-1 sm:ms-3" aria-label="التنقل الرئيسي">
          <a
            routerLink="/courses"
            routerLinkActive="bg-white text-plum shadow-[0_2px_10px_-4px_rgba(107,45,134,0.35)]"
            class="rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-plum"
          >
            الكورسات
          </a>
          <a
            routerLink="/my-courses"
            routerLinkActive="bg-white text-plum shadow-[0_2px_10px_-4px_rgba(107,45,134,0.35)]"
            class="rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-plum"
          >
            كورساتي
          </a>
        </nav>

        <button
          type="button"
          (click)="auth.logout()"
          aria-label="تسجيل خروج"
          class="ms-auto flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-plum/40 hover:text-plum focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
        >
          <!-- a small door-with-arrow icon -->
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
            <path d="M10 17l-5-5 5-5" />
            <path d="M5 12h9" />
          </svg>
          <span class="hidden sm:inline">تسجيل خروج</span>
        </button>
      </div>
    </header>
  `,
})
export class AppHeader {
  auth = inject(AuthService);
}
