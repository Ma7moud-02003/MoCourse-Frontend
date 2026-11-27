import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/notification.service';
import { Profile, UserService } from '../../core/user.service';

// One link of the side menu (desktop) and of the bottom tabs (phone).
interface NavItem {
  label: string;
  path: string;
  icon: string; // the "d" of a simple line icon
  exact?: boolean;
}

const ICONS = {
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  browse: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z',
  courses: 'M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zM4 20a2 2 0 0 0 2 2h13v-4',
  certificate: 'M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM8.5 14L7 22l5-3 5 3-1.5-8',
  profile: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c0-4 4-6 8-6s8 2 8 6',
};

const STUDENT_LINKS: NavItem[] = [
  { label: 'الرئيسية', path: '/dashboard', icon: ICONS.home },
  { label: 'تصفّح الكورسات', path: '/courses', icon: ICONS.browse },
  { label: 'كورساتي', path: '/my-courses', icon: ICONS.courses },
  { label: 'شهاداتي', path: '/certificates', icon: ICONS.certificate },
  { label: 'حسابي', path: '/profile', icon: ICONS.profile },
];

const TEACHER_LINKS: NavItem[] = [
  { label: 'الرئيسية', path: '/teacher/dashboard', icon: ICONS.home },
  { label: 'كورساتي', path: '/teacher', icon: ICONS.courses, exact: true },
  { label: 'حسابي', path: '/profile', icon: ICONS.profile },
];

// The frame around every page a logged-in user sees:
// a top bar (logo, bell, his name), a side menu on desktop and tabs at the bottom on a phone.
// The page itself stays a normal column. The CSS in styles.css ("has-shell") makes room for the menu.
// Every page reuses it with one line: <app-header />
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <!-- Top bar -->
    <header class="sticky top-0 z-30 h-16 border-b border-line bg-white/90 backdrop-blur">
      <div class="mx-auto flex h-full w-full items-center gap-2.5 px-4 sm:px-6">
        <a routerLink="/" class="flex items-center gap-2 text-[19px] font-bold">
          <img src="logo.svg" alt="" width="34" height="34" />
          <strong>MoCourse</strong>
        </a>

        <!-- The bell: a number shows how many notifications are unread -->
        <a
          routerLink="/notifications"
          routerLinkActive="text-plum"
          class="relative ms-auto flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-plum/40 hover:text-plum"
          [attr.aria-label]="
            notifications.unread() > 0
              ? 'الإشعارات، ' + notifications.unread() + ' جديد'
              : 'الإشعارات'
          "
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7" />
            <path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
          @if (notifications.unread() > 0) {
            <span class="absolute -top-1 -end-1 flex min-w-[18px] items-center justify-center rounded-full bg-coral px-1 text-[11px] font-bold leading-[18px] text-white">
              {{ notifications.unread() > 9 ? '9+' : notifications.unread() }}
            </span>
          }
        </a>

        <!-- His name and role; opens his account -->
        <a routerLink="/profile" class="flex items-center gap-2.5" aria-label="حسابي">
          @if (me(); as p) {
            <span class="hidden text-start leading-tight sm:block">
              <span class="block text-[13px] font-semibold">{{ p.fullName || 'حسابي' }}</span>
              <span class="block text-[11px] text-muted">{{ roleLabel() }}</span>
            </span>
            @if (p.avatar) {
              <img [src]="p.avatar" alt="" class="size-10 rounded-full object-cover" />
            } @else {
              <span class="flex size-10 items-center justify-center rounded-full bg-plum text-[14px] font-bold text-white">
                {{ (p.fullName || '؟').charAt(0) }}
              </span>
            }
          } @else {
            <span class="size-10 rounded-full bg-art"></span>
          }
        </a>

        <button
          type="button"
          (click)="auth.logout()"
          aria-label="تسجيل خروج"
          class="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-2.5 py-2 text-sm font-medium text-ink transition-colors hover:border-plum/40 hover:text-plum sm:px-3"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
            <path d="M10 17l-5-5 5-5" />
            <path d="M5 12h9" />
          </svg>
          <span class="hidden sm:inline">تسجيل خروج</span>
        </button>
      </div>
    </header>

    <!-- Side menu: desktop only, fixed on the right -->
    <nav
      class="fixed bottom-0 right-0 top-16 z-20 hidden w-[220px] border-s border-line bg-white p-3 lg:block"
      aria-label="التنقل الرئيسي"
    >
      @for (item of links(); track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="bg-[#efe6f5] text-plum font-semibold"
          [routerLinkActiveOptions]="{ exact: !!item.exact }"
          class="mb-1 flex items-center gap-3 rounded-xl px-3.5 py-3 text-[14px] font-medium text-muted transition-colors hover:text-plum"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path [attr.d]="item.icon" />
          </svg>
          {{ item.label }}
        </a>
      }
    </nav>

    <!-- Tabs at the bottom: phone and tablet only -->
    <nav
      class="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white lg:hidden"
      aria-label="التنقل السفلي"
    >
      @for (item of links(); track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="text-plum"
          [routerLinkActiveOptions]="{ exact: !!item.exact }"
          class="flex flex-1 flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[11px] font-medium text-muted"
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path [attr.d]="item.icon" />
          </svg>
          {{ item.label.replace('تصفّح ', '') }}
        </a>
      }
    </nav>
  `,
})
export class AppHeader implements OnInit, OnDestroy {
  auth = inject(AuthService);
  notifications = inject(NotificationService);
  private user = inject(UserService);

  me = signal<Profile | null>(null);
  links = computed(() => (this.auth.role() === 'student' ? STUDENT_LINKS : TEACHER_LINKS));
  roleLabel = computed(() => (this.auth.role() === 'student' ? 'طالب' : 'مدرّس'));

  ngOnInit() {
    // styles.css uses this class to make room for the side menu and the bottom tabs
    document.body.classList.add('has-shell');
    // Ask once how many notifications are unread each time a page with this header opens.
    this.notifications.refreshUnread();
    this.user.me().subscribe({ next: (r) => this.me.set(r.personalInfo), error: () => undefined });
  }

  ngOnDestroy() {
    document.body.classList.remove('has-shell');
  }
}
