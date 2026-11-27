import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService, TeacherLastInfo, TeacherNumbers } from '../core/dashboard.service';
import { errorMessage } from '../core/error-message';
import {
  JoinRequest,
  MyPaymentInfo,
  PaymentInfoBody,
  TeacherCourse,
  TeacherService,
} from '../core/teacher.service';
import { UserService } from '../core/user.service';
import { AppFooter } from '../layout/app-footer/app-footer';
import { AppHeader } from '../layout/app-header/app-header';

// Where a teacher lands after login: his courses, the students asking to join them,
// and the payment numbers his students need.
@Component({
  selector: 'app-teacher-home',
  imports: [RouterLink, AppHeader, AppFooter, DecimalPipe],
  templateUrl: './teacher-home.html',
})
export class TeacherHome implements OnInit {
  private teacher = inject(TeacherService);
  private dashboard = inject(DashboardService);
  private user = inject(UserService);

  // the greeting, the numbers and the two small boxes
  name = signal('');
  numbers = signal<TeacherNumbers | null>(null);
  last = signal<TeacherLastInfo | null>(null);

  // the requests where he ticked "I checked the money arrived"; accepting needs the tick
  confirmed = signal<Set<number>>(new Set());

  courses = signal<TeacherCourse[]>([]);
  coursesLoading = signal(true);

  requests = signal<JoinRequest[]>([]);
  requestsLoading = signal(true);
  requestsNote = signal('');

  // which request is being answered right now, so its two buttons can say "بنحفظ..."
  deciding = signal<number | null>(null);
  decideNote = signal('');

  paymentInfo = signal<MyPaymentInfo | null>(null);
  paymentSaving = signal(false);
  paymentNote = signal('');
  paymentSaved = signal(false);

  // the form he fills (empty strings so the inputs are never "undefined")
  form = signal<PaymentInfoBody>({
    instapay: '',
    vodafoneCash: '',
    orangeCash: '',
    bankAccount: '',
    ownerName: '',
  });

  ngOnInit() {
    this.user.me().subscribe({ next: (r) => this.name.set(r.personalInfo.fullName ?? '') });
    this.dashboard.teacherNumbers().subscribe({ next: (n) => this.numbers.set(n) });
    this.dashboard.teacherLastInfo().subscribe({ next: (l) => this.last.set(l) });
    this.loadCourses();
    this.loadRequests();
    this.loadPaymentInfo();
  }

  toggleConfirmed(id: number) {
    this.confirmed.update((set) => {
      const next = new Set(set);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  loadCourses() {
    this.coursesLoading.set(true);
    this.teacher.myCourses().subscribe({
      next: (list) => {
        this.courses.set(list);
        this.coursesLoading.set(false);
      },
      error: () => {
        this.courses.set([]);
        this.coursesLoading.set(false);
      },
    });
  }

  // The requests waiting for his answer. Those are the only ones he can act on,
  // so they are the only ones we ask for.
  loadRequests() {
    this.requestsLoading.set(true);
    this.requestsNote.set('');
    this.teacher.joinRequests('WAITING_APPROVAL').subscribe({
      next: (list) => {
        this.requests.set(list);
        this.requestsLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.requestsLoading.set(false);
        this.requestsNote.set(
          err.status === 403 ? 'الصفحة دي للمدرّسين بس.' : errorMessage(err),
        );
      },
    });
  }

  // Accepting the request is what enrolls the student in the course.
  decide(request: JoinRequest, status: 'PAID' | 'FAILED') {
    this.deciding.set(request.id);
    this.decideNote.set('');

    this.teacher.decide(request.id, status).subscribe({
      next: () => {
        this.deciding.set(null);
        // it leaves the waiting list either way: accepted (the student is in) or refused
        this.requests.update((list) => list.filter((item) => item.id !== request.id));
      },
      error: (err: HttpErrorResponse) => {
        this.deciding.set(null);
        this.decideNote.set(errorMessage(err));
      },
    });
  }

  loadPaymentInfo() {
    this.teacher.myPaymentInfo().subscribe({
      next: (info) => {
        this.paymentInfo.set(info);
        this.form.set({
          instapay: info.instapay ?? '',
          vodafoneCash: info.vodafonCach ?? '',
          orangeCash: info.orangeCash ?? '',
          bankAccount: info.bankAccount ?? '',
          ownerName: info.ownerName ?? '',
        });
      },
      // 404 simply means he has not saved any numbers yet, which is not an error to show
      error: () => this.paymentInfo.set(null),
    });
  }

  setField(field: keyof PaymentInfoBody, value: string) {
    this.form.update((all) => ({ ...all, [field]: value }));
  }

  savePaymentInfo() {
    const info = this.form();
    if (!info.ownerName.trim()) {
      this.paymentNote.set('اكتب اسم صاحب الحساب اللي الطالب هيحوّل عليه.');
      return;
    }

    this.paymentSaving.set(true);
    this.paymentNote.set('');
    this.teacher.savePaymentInfo(info, this.paymentInfo() !== null).subscribe({
      next: () => {
        this.paymentSaving.set(false);
        this.paymentSaved.set(true);
        this.loadPaymentInfo();
      },
      error: (err: HttpErrorResponse) => {
        this.paymentSaving.set(false);
        this.paymentNote.set(this.paymentError(err));
      },
    });
  }

  // The backend checks each number's shape, so its own message is the useful one here.
  private paymentError(err: HttpErrorResponse): string {
    const body = err.error as { message?: string | string[] } | null;
    const raw = Array.isArray(body?.message) ? body?.message.join(' ') : body?.message;
    if (raw?.includes('Vodafone Cash')) return 'رقم فودافون كاش لازم يبقى 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015.';
    if (raw?.includes('Orange Cash')) return 'رقم أورنج كاش لازم يبقى 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015.';
    if (raw?.includes('bankAccount')) return 'رقم الحساب البنكي لازم يبقى بين 10 و34 رقم.';
    if (raw?.includes('instapay')) return 'رقم إنستاباي لازم يبقى بين 5 و100 حرف.';
    return errorMessage(err);
  }

  // What the request status means, in one plain line.
  statusText(status: string): string {
    if (status === 'WAITING_APPROVAL') return 'مستني موافقتك';
    if (status === 'PAID') return 'مقبول';
    if (status === 'FAILED') return 'مرفوض';
    return 'لسه مادفعش';
  }

  // The Arabic name of the way the student says he paid.
  methodText(method: string | null): string {
    if (method === 'instapay') return 'إنستاباي';
    if (method === 'vodafonCach') return 'فودافون كاش';
    if (method === 'orangeCash') return 'أورنج كاش';
    if (method === 'bankAccount') return 'تحويل بنكي';
    return 'مش محدد';
  }
}
