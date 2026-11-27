import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { errorMessage } from '../../core/error-message';
import { JoinRequest, PurchaseStatus, TeacherService } from '../../core/teacher.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// One tab of the page: a title and the status it asks the backend for.
interface Tab {
  label: string;
  status: PurchaseStatus;
}

// All the join requests on his courses, one tab per status.
// Only the "waiting" tab has buttons, because that is the only status he can still change.
@Component({
  selector: 'app-payment-requests',
  imports: [AppHeader, AppFooter],
  templateUrl: './payment-requests.html',
})
export class PaymentRequests implements OnInit {
  private teacher = inject(TeacherService);

  tabs: Tab[] = [
    { label: 'مستنية موافقتك', status: 'WAITING_APPROVAL' },
    { label: 'مقبولة', status: 'PAID' },
    { label: 'مرفوضة', status: 'FAILED' },
  ];
  current = signal<PurchaseStatus>('WAITING_APPROVAL');

  requests = signal<JoinRequest[]>([]);
  loading = signal(true);
  note = signal('');

  // the requests where he ticked "I checked the money arrived"
  confirmed = signal<Set<number>>(new Set());
  deciding = signal<number | null>(null);

  ngOnInit() {
    this.load();
  }

  pick(status: PurchaseStatus) {
    this.current.set(status);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.note.set('');
    this.teacher.joinRequests(this.current()).subscribe({
      next: (list) => {
        this.requests.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.requests.set([]);
        this.loading.set(false);
        this.note.set(err.status === 403 ? 'الصفحة دي للمدرّسين بس.' : errorMessage(err));
      },
    });
  }

  toggleConfirmed(id: number) {
    this.confirmed.update((set) => {
      const next = new Set(set);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  // Accepting enrolls the student. Either answer takes the request out of this tab.
  decide(request: JoinRequest, status: 'PAID' | 'FAILED') {
    this.deciding.set(request.id);
    this.note.set('');
    this.teacher.decide(request.id, status).subscribe({
      next: () => {
        this.deciding.set(null);
        this.requests.update((list) => list.filter((item) => item.id !== request.id));
      },
      error: (err: HttpErrorResponse) => {
        this.deciding.set(null);
        this.note.set(errorMessage(err));
      },
    });
  }

  methodText(method: string | null): string {
    if (method === 'instapay') return 'إنستاباي';
    if (method === 'vodafonCach') return 'فودافون كاش';
    if (method === 'orangeCash') return 'أورنج كاش';
    if (method === 'bankAccount') return 'تحويل بنكي';
    return 'مش محدد';
  }
}
