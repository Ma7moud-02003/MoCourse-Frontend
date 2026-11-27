import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';
import { AppNotification, NotificationService } from '../core/notification.service';
import { AppFooter } from '../layout/app-footer/app-footer';
import { AppHeader } from '../layout/app-header/app-header';

// "الإشعارات": what happened to the user's courses, requests and certificates.
@Component({
  selector: 'app-notifications',
  imports: [AppHeader, AppFooter],
  templateUrl: './notifications.html',
})
export class Notifications implements OnInit {
  private service = inject(NotificationService);
  private auth = inject(AuthService);
  private router = inject(Router);

  items = signal<AppNotification[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  error = signal('');
  page = signal(1);
  hasMore = signal(false);
  unread = this.service.unread;

  ngOnInit() {
    this.service.refreshUnread();
    this.load(1);
  }

  private load(page: number) {
    this.service.list(page).subscribe({
      next: (result) => {
        this.items.update((list) => (page === 1 ? result.items : [...list, ...result.items]));
        this.page.set(page);
        this.hasMore.set(page < (result.totalPages ?? 1));
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  more() {
    this.loadingMore.set(true);
    this.load(this.page() + 1);
  }

  // Where a notification leads. Null means it is only a message.
  private target(item: AppNotification): string[] | null {
    if (item.type === 'certificate' && item.resourceId)
      return ['/certificates', String(item.resourceId)];
    // A teacher's "someone asked to join" notice is handled on his home page.
    if (item.type === 'purchase' && this.auth.role() !== 'student') return ['/teacher'];
    if (['purchase', 'enrollment', 'course'].includes(item.type) && item.resourceId) {
      return ['/courses', String(item.resourceId)];
    }
    return null;
  }

  open(item: AppNotification) {
    if (!item.isRead) {
      this.service.markRead(item.id).subscribe({
        next: () =>
          this.items.update((list) =>
            list.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
          ),
        error: () => undefined,
      });
    }
    const target = this.target(item);
    if (target) this.router.navigate(target);
  }

  readAll() {
    this.service.markAllRead().subscribe({
      next: () => this.items.update((list) => list.map((n) => ({ ...n, isRead: true }))),
      error: () => undefined,
    });
  }

  dateText(value: string): string {
    return new Date(value).toLocaleDateString('ar-EG-u-nu-latn', {
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
