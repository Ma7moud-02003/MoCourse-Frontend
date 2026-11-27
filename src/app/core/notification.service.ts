import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { API_URL } from './config';

// What a notification is about. The page uses it to decide where the notification leads.
export type NotificationType =
  'purchase' | 'enrollment' | 'course' | 'certificate' | 'quiz' | 'system';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  resourceId: number | null; // the certificate or course the notification is about
  createdAt: string;
}

export interface NotificationPage {
  items: AppNotification[];
  page: number;
  totalPages: number | null;
  total: number;
}

// The user's own notifications, for students and teachers alike.
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);

  // How many are unread. The bell in the header shows this number.
  unread = signal(0);

  // GET /api/notifications?page=&limit= (newest first)
  list(page: number) {
    return this.http.get<NotificationPage>(`${API_URL}/notifications`, {
      params: { page, limit: 20 },
    });
  }

  // GET /api/notifications/unread-count
  refreshUnread() {
    this.http
      .get<{ unreadCount: number }>(`${API_URL}/notifications/unread-count`)
      .subscribe({ next: (r) => this.unread.set(r.unreadCount), error: () => undefined });
  }

  // PATCH /api/notifications/:id/read
  markRead(id: number) {
    return this.http
      .patch(`${API_URL}/notifications/${id}/read`, {})
      .pipe(tap(() => this.unread.update((n) => Math.max(n - 1, 0))));
  }

  // PATCH /api/notifications/read-all
  markAllRead() {
    return this.http
      .patch(`${API_URL}/notifications/read-all`, {})
      .pipe(tap(() => this.unread.set(0)));
  }
}
