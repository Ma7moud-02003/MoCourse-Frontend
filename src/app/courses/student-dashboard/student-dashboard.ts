import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DashboardService, StudentDashboard as Data } from '../../core/dashboard.service';
import { errorMessage } from '../../core/error-message';
import { ProgressService } from '../../core/progress.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// "لوحتي": the student's numbers and the quickest way back into learning.
@Component({
  selector: 'app-student-dashboard',
  imports: [AppHeader, AppFooter, RouterLink],
  templateUrl: './student-dashboard.html',
})
export class StudentDashboard implements OnInit {
  private dashboard = inject(DashboardService);
  private progress = inject(ProgressService);
  private router = inject(Router);

  data = signal<Data | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    this.dashboard.student().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  // The newest course is where he most likely wants to continue. The backend knows the exact lesson.
  continueLearning(courseId: number) {
    this.progress.resume(courseId).subscribe({
      next: (point) =>
        this.router.navigate(
          point ? ['/courses', courseId, 'lessons', point.lessonId] : ['/courses', courseId],
        ),
      error: () => this.router.navigate(['/courses', courseId]),
    });
  }
}
