import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/notification.service';

// The bar at the top of every page a logged-in user sees:
// the logo, the links for his role, the notifications bell, and the way out (log out).
// It is a small component so every new page can reuse it with one line: <app-header />
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div class="mx-auto flex h-16 w-full max-w-[1120px] items-center gap-2 px-3 sm:gap-3 sm:px-5">
        <!-- The logo leads home: the page that fits the role -->
        <a routerLink="/" class="hidden items-center gap-2 sm:flex text-[19px] font-bold">
          <img src="logo.svg" alt="" width="34" height="34" />
          <strong class="hidden sm:inline">MoCourse</strong>
        </a>

        <!-- A student and a teacher have different pages, so each sees his own links -->
        <nav
          class="ms-1 flex min-w-0 items-center gap-1 overflow-x-auto sm:ms-3"
          aria-label="التنقل الرئيسي"
        >
          @if (auth.role() === 'student') {
            <a
              routerLink="/dashboard"
              routerLinkActive="bg-white text-plum shadow-[0_2px_10px_-4px_rgba(107,45,134,0.35)]"
              class="shrink-0 whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium text-muted transition-colors hover:text-plum sm:px-3.5 sm:text-sm"
              >لوحتي</a
            >
            <a
              routerLink="/courses"
              routerLinkActive="bg-white text-plum shadow-[0_2px_10px_-4px_rgba(107,45,134,0.35)]"
              class="shrink-0 whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium text-muted sm:px-3.5 sm:text-sm transition-colors hover:text-plum"
              >الكورسات</a
            >
            <a
              routerLink="/my-courses"
              routerLinkActive="bg-white text-plum shadow-[0_2px_10px_-4px_rgba(107,45,134,0.35)]"
              class="shrink-0 whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium text-muted sm:px-3.5 sm:text-sm transition-colors hover:text-plum"
              >كورساتي</a
            >
            <a
              routerLink="/certificates"
              routerLinkActive="bg-white text-plum shadow-[0_2px_10px_-4px_rgba(107,45,134,0.35)]"
              class="shrink-0 whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium text-muted sm:px-3.5 sm:text-sm transition-colors hover:text-plum"
              >شهاداتي</a
            >
          } @else {
            <a
              routerLink="/teacher"
              routerLinkActive="bg-white text-plum shadow-[0_2px_10px_-4px_rgba(107,45,134,0.35)]"
              class="shrink-0 whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium text-muted sm:px-3.5 sm:text-sm transition-colors hover:text-plum"
              >كورساتي</a
            >
          }
        </nav>

        <!-- The bell: a number shows how many notifications are unread -->
        <a
          routerLink="/notifications"
          routerLinkActive="text-plum"
          class="relative ms-auto flex size-9 shrink-0 sm:size-10 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-plum/40 hover:text-plum"
          [attr.aria-label]="
            notifications.unread() > 0
              ? 'الإشعارات، ' + notifications.unread() + ' جديد'
              : 'الإشعارات'
          "
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7" />
            <path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
          @if (notifications.unread() > 0) {
            <span
              class="absolute -top-1 -end-1 flex min-w-[18px] items-center justify-center rounded-full bg-coral px-1 text-[11px] font-bold leading-[18px] text-white"
            >
              {{ notifications.unread() > 9 ? '9+' : notifications.unread() }}
            </span>
          }
        </a>

        <!-- His own account -->
        <a
          routerLink="/profile"
          routerLinkActive="text-plum"
          aria-label="حسابي"
          class="flex size-9 shrink-0 sm:size-10 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-plum/40 hover:text-plum"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </a>

        <button
          type="button"
          (click)="auth.logout()"
          aria-label="تسجيل خروج"
          class="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-plum/40 hover:text-plum focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
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
export class AppHeader implements OnInit {
  auth = inject(AuthService);
  notifications = inject(NotificationService);

  // Ask once how many notifications are unread each time a page with this header opens.
  ngOnInit() {
    this.notifications.refreshUnread();
  }
}
