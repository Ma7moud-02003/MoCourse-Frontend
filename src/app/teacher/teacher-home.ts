import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService, TeacherLastInfo, TeacherNumbers } from '../core/dashboard.service';
import { errorMessage } from '../core/error-message';
import {
  JoinRequest,
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

  ngOnInit() {
    this.user.me().subscribe({ next: (r) => this.name.set(r.personalInfo.fullName ?? '') });
    this.dashboard.teacherNumbers().subscribe({ next: (n) => this.numbers.set(n) });
    this.dashboard.teacherLastInfo().subscribe({ next: (l) => this.last.set(l) });
    this.loadCourses();
    this.loadRequests();
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
