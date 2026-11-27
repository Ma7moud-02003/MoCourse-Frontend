import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  DashboardService,
  TeacherLastInfo,
  TeacherNumbers,
} from '../../core/dashboard.service';
import { errorMessage } from '../../core/error-message';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// The teacher's dashboard: his numbers, plus what happened lately.
@Component({
  selector: 'app-teacher-dashboard',
  imports: [AppHeader, AppFooter, RouterLink, DecimalPipe],
  templateUrl: './teacher-dashboard.html',
})
export class TeacherDashboard implements OnInit {
  private dashboard = inject(DashboardService);

  numbers = signal<TeacherNumbers | null>(null);
  last = signal<TeacherLastInfo | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    this.dashboard.teacherNumbers().subscribe({
      next: (n) => {
        this.numbers.set(n);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
    // The "lately" part is a bonus: if it fails, the numbers still show.
    this.dashboard.teacherLastInfo().subscribe({ next: (l) => this.last.set(l) });
  }
}
