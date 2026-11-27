import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DashboardService, StudentDashboard as Data } from '../../core/dashboard.service';
import { EnrollmentService, SuggestedCourse } from '../../core/enrollment.service';
import { errorMessage } from '../../core/error-message';
import { CourseProgress, ProgressService } from '../../core/progress.service';
import { UserService } from '../../core/user.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { LaptopArt } from '../../shared/art/student-art';
import { AppHeader } from '../../layout/app-header/app-header';

// The student's home: where he stopped, his numbers, his newest courses and ideas for more.
@Component({
  selector: 'app-student-dashboard',
  imports: [AppHeader, AppFooter, RouterLink, LaptopArt],
  templateUrl: './student-dashboard.html',
})
export class StudentDashboard implements OnInit {
  private dashboard = inject(DashboardService);
  private progress = inject(ProgressService);
  private enrollment = inject(EnrollmentService);
  private users = inject(UserService);
  private router = inject(Router);

  data = signal<Data | null>(null);
  loading = signal(true);
  error = signal('');
  firstName = signal('');
  // how far he got in the newest course (shown in the big card)
  lastProgress = signal<CourseProgress | null>(null);
  // the progress of each of the "last courses", by course id
  progressOf = signal<Record<number, number>>({});
  suggestions = signal<SuggestedCourse[]>([]);

  ngOnInit() {
    this.users.me().subscribe({
      next: (r) => this.firstName.set((r.personalInfo.fullName ?? '').split(' ')[0]),
      error: () => {},
    });

    this.dashboard.student().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
        this.loadProgress(data);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });

    // The suggestions are a bonus: if they fail, the page simply shows no section.
    this.enrollment.suggested().subscribe({
      next: (list) => this.suggestions.set(list.slice(0, 4)),
      error: () => {},
    });
  }

  // One small call per course to get "13 of 18 lessons" and the percent.
  private loadProgress(data: Data) {
    data.lastCourses.forEach((item, index) => {
      this.progress.course(item.course.id).subscribe({
        next: (p) => {
          this.progressOf.update((all) => ({ ...all, [item.course.id]: p.persentage }));
          if (index === 0) this.lastProgress.set(p);
        },
        error: () => {},
      });
    });
  }

  // The backend knows the exact lesson he should continue with.
  continueLearning(courseId: number) {
    this.progress.resume(courseId).subscribe({
      next: (point) =>
        this.router.navigate(
          point ? ['/courses', courseId, 'lessons', point.lessonId] : ['/courses', courseId],
        ),
      error: () => this.router.navigate(['/courses', courseId]),
    });
  }

  // The price after the discount, when there is a real one.
  price(course: SuggestedCourse): number {
    const d = course.discountPrice;
    return typeof d === 'number' && d > 0 && d < course.price ? d : course.price;
  }
}
